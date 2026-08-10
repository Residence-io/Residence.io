'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api-client';
import type { Department, WorkerSetup } from '@/lib/workforce-types';

const input = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm';
function useAction(csrfToken: string) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(path: string, body: unknown) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        id?: string;
      };
      if (!response.ok)
        throw new Error(result.message ?? 'Action could not be completed.');
      setMessage('Action completed.');
      router.refresh();
      return result;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Action could not be completed.',
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { submit, message, busy };
}

export function DepartmentForms({
  csrfToken,
  departments,
}: {
  csrfToken: string;
  departments: Department[];
}) {
  const action = useAction(csrfToken);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void action.submit('/workforce/departments', {
            name: data.get('name'),
            description: data.get('description'),
            displayOrder: 0,
            active: true,
          });
        }}
      >
        <h2 className="font-semibold">New department</h2>
        <input
          className={input}
          name="name"
          placeholder="Department name"
          required
        />
        <input className={input} name="description" placeholder="Description" />
        <Button disabled={action.busy}>Create department</Button>
      </form>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void action.submit('/workforce/job-titles', {
            departmentId: data.get('departmentId'),
            name: data.get('name'),
            description: data.get('description'),
            displayOrder: 0,
            active: true,
          });
        }}
      >
        <h2 className="font-semibold">New job title</h2>
        <select className={input} name="departmentId" required>
          {departments
            .filter((d) => d.active)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
        <input className={input} name="name" placeholder="Job title" required />
        <input className={input} name="description" placeholder="Description" />
        <Button disabled={action.busy}>Create job title</Button>
      </form>
      {action.message && (
        <p className="text-sm text-slate-600">{action.message}</p>
      )}
    </div>
  );
}

type JobTitle = { id: string; name: string; active: boolean };
type DeptWithSociety = Department & { societyId?: string };

export function StaffRegistrationForm({
  csrfToken,
  departments,
}: {
  csrfToken: string;
  departments: DeptWithSociety[];
}) {
  const action = useAction(csrfToken);
  const router = useRouter();

  // ── shared society id (from any existing department) ────────────────────
  const societyId = departments[0]?.societyId ?? '';

  // ── Department & Job Title state ──────────────────────────────────────────
  const [selectedDeptId, setSelectedDeptId] = useState(
    departments[0]?.id ?? '',
  );
  const [localDepts, setLocalDepts] = useState<DeptWithSociety[]>(departments);

  // Department manager
  const [managingDepts, setManagingDepts] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [deptBusy, setDeptBusy] = useState(false);
  const [deptError, setDeptError] = useState('');

  // Job title manager
  const [managingTitles, setManagingTitles] = useState(false);
  const [newTitleName, setNewTitleName] = useState('');
  const [titleBusy, setTitleBusy] = useState(false);
  const [titleError, setTitleError] = useState('');

  const selectedDept = localDepts.find((d) => d.id === selectedDeptId);
  const jobTitles = (selectedDept?.jobTitles ?? []).filter((j) => j.active);

  // ── Department add / delete ───────────────────────────────────────────────
  async function addDepartment() {
    if (!newDeptName.trim()) return;
    setDeptBusy(true);
    setDeptError('');
    try {
      const res = await fetch(`${API_URL}/department`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          society_id: societyId,
          name: newDeptName.trim(),
          normalized_name: newDeptName.trim().toUpperCase(),
          active: true,
          display_order: localDepts.length,
          updated_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to add department');
      setLocalDepts((prev) => [
        ...prev,
        {
          id: data.id,
          societyId,
          name: newDeptName.trim(),
          active: true,
          description: null,
          jobTitles: [],
        },
      ]);
      setNewDeptName('');
    } catch (e: any) {
      setDeptError(e.message);
    } finally {
      setDeptBusy(false);
    }
  }

  async function deleteDepartment(deptId: string) {
    setDeptBusy(true);
    setDeptError('');
    try {
      const res = await fetch(`${API_URL}/department/${deptId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-token': csrfToken },
      });
      if (!res.ok) throw new Error('Failed to delete department');
      setLocalDepts((prev) => prev.filter((d) => d.id !== deptId));
      if (selectedDeptId === deptId) setSelectedDeptId('');
    } catch (e: any) {
      setDeptError(e.message);
    } finally {
      setDeptBusy(false);
    }
  }

  // ── Job title add / delete ────────────────────────────────────────────────
  function updateDeptTitles(
    deptId: string,
    updater: (t: JobTitle[]) => JobTitle[],
  ) {
    setLocalDepts((prev) =>
      prev.map((d) =>
        d.id === deptId ? { ...d, jobTitles: updater(d.jobTitles ?? []) } : d,
      ),
    );
  }

  async function addJobTitle() {
    if (!newTitleName.trim() || !selectedDeptId) return;
    setTitleBusy(true);
    setTitleError('');
    try {
      const res = await fetch(`${API_URL}/job_title`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          department_id: selectedDeptId,
          society_id: selectedDept?.societyId,
          name: newTitleName.trim(),
          normalized_name: newTitleName.trim().toUpperCase(),
          active: true,
          updated_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to add job title');
      updateDeptTitles(selectedDeptId, (prev) => [
        ...prev,
        { id: data.id, name: newTitleName.trim(), active: true },
      ]);
      setNewTitleName('');
    } catch (e: any) {
      setTitleError(e.message);
    } finally {
      setTitleBusy(false);
    }
  }

  async function deleteJobTitle(titleId: string) {
    setTitleBusy(true);
    setTitleError('');
    try {
      const res = await fetch(`${API_URL}/job_title/${titleId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-token': csrfToken },
      });
      if (!res.ok) throw new Error('Failed to delete job title');
      updateDeptTitles(selectedDeptId, (prev) =>
        prev.filter((j) => j.id !== titleId),
      );
    } catch (e: any) {
      setTitleError(e.message);
    } finally {
      setTitleBusy(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void action
          .submit('/workforce/staff', {
            fullName: data.get('fullName'),
            identityNumber: data.get('identityNumber') || undefined,
            email: data.get('email') || undefined,
            primaryPhone: data.get('primaryPhone'),
            address: data.get('address') || undefined,
            departmentId: data.get('departmentId'),
            jobTitleId: data.get('jobTitleId'),
            employmentType: data.get('employmentType'),
            joiningDate: data.get('joiningDate'),
          })
          .then((result) => {
            if (result?.id) router.push(`/admin/staff/${result.id}`);
          });
      }}
    >
      {/* ── Personal Information ─────────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Personal Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </span>
            <input
              className={input}
              name="fullName"
              placeholder="e.g. Ahmed Khan"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              CNIC / Identity Number
            </span>
            <input
              className={input}
              name="identityNumber"
              placeholder="e.g. 3520112345671"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Phone <span className="text-red-500">*</span>
            </span>
            <input
              className={input}
              name="primaryPhone"
              placeholder="e.g. 0300-1234567"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </span>
            <input
              className={input}
              name="email"
              type="email"
              placeholder="e.g. ahmed@example.com"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Address
            </span>
            <input
              className={input}
              name="address"
              placeholder="Residential address"
            />
          </label>
        </div>
      </div>

      {/* ── Employment Details ───────────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Employment Details
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="block">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Department <span className="text-red-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setManagingDepts((v) => !v);
                  setManagingTitles(false);
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                {managingDepts ? '✕ Close' : '⚙ Manage departments'}
              </button>
            </div>
            <select
              className={input}
              name="departmentId"
              required
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setManagingTitles(false);
                setTitleError('');
              }}
            >
              <option value="">Select department</option>
              {localDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Inline Department Manager ────────────────────────────────────── */}
        {managingDepts && (
          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Departments
            </p>
            {localDepts.length === 0 ? (
              <p className="mb-3 text-sm text-slate-500">No departments yet.</p>
            ) : (
              <ul className="mb-3 space-y-1">
                {localDepts.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{d.name}</span>
                    <button
                      type="button"
                      disabled={deptBusy}
                      onClick={() => deleteDepartment(d.id)}
                      className="ml-3 rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="New department name…"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void addDepartment();
                  }
                }}
              />
              <button
                type="button"
                disabled={deptBusy || !newDeptName.trim()}
                onClick={() => void addDepartment()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                {deptBusy ? '…' : '+ Add'}
              </button>
            </div>
            {deptError && (
              <p className="mt-2 text-xs text-red-600">{deptError}</p>
            )}
          </div>
        )}

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {/* Job Title + Manage button */}
          <div className="block">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Job Title <span className="text-red-500">*</span>
              </span>
              {selectedDeptId && (
                <button
                  type="button"
                  onClick={() => setManagingTitles((v) => !v)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  {managingTitles ? '✕ Close' : '⚙ Manage titles'}
                </button>
              )}
            </div>
            <select className={input} name="jobTitleId" required>
              <option value="">Select job title</option>
              {jobTitles.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Inline Job Title Manager ────────────────────────────────────── */}
        {managingTitles && selectedDeptId && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Job Titles — {selectedDept?.name}
            </p>

            {/* Existing titles list */}
            {jobTitles.length === 0 ? (
              <p className="mb-3 text-sm text-slate-500">No job titles yet.</p>
            ) : (
              <ul className="mb-3 space-y-1">
                {jobTitles.map((j) => (
                  <li
                    key={j.id}
                    className="flex items-center justify-between rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{j.name}</span>
                    <button
                      type="button"
                      disabled={titleBusy}
                      onClick={() => deleteJobTitle(j.id)}
                      className="ml-3 rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add new title */}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="New job title name…"
                value={newTitleName}
                onChange={(e) => setNewTitleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void addJobTitle();
                  }
                }}
              />
              <button
                type="button"
                disabled={titleBusy || !newTitleName.trim()}
                onClick={() => void addJobTitle()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {titleBusy ? '…' : '+ Add'}
              </button>
            </div>
            {titleError && (
              <p className="mt-2 text-xs text-red-600">{titleError}</p>
            )}
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Employment Type <span className="text-red-500">*</span>
            </span>
            <select className={input} name="employmentType" required>
              <option value="PERMANENT">Permanent</option>
              <option value="CONTRACT">Contract</option>
              <option value="PART_TIME">Part-time</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="DAILY_WAGE">Daily Wage</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Joining Date <span className="text-red-500">*</span>
            </span>
            <input className={input} name="joiningDate" type="date" required />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <Button disabled={action.busy} className="px-8">
          {action.busy ? 'Registering…' : 'Register Staff Member'}
        </Button>
        {action.message && (
          <p className="text-sm text-slate-600">{action.message}</p>
        )}
      </div>
    </form>
  );
}

export function WorkerSetupForms({ csrfToken }: { csrfToken: string }) {
  const action = useAction(csrfToken);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const d = new FormData(event.currentTarget);
          void action.submit('/workforce/worker-categories', {
            code: String(d.get('code')).toUpperCase(),
            name: d.get('name'),
            description: d.get('description') || undefined,
          });
        }}
      >
        <h2 className="font-semibold">New worker category</h2>
        <input className={input} name="code" placeholder="PLUMBER" required />
        <input
          className={input}
          name="name"
          placeholder="Category name"
          required
        />
        <input className={input} name="description" placeholder="Description" />
        <Button disabled={action.busy}>Create category</Button>
      </form>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const d = new FormData(event.currentTarget);
          void action.submit('/workforce/worker-skills', {
            name: d.get('name'),
            description: d.get('description') || undefined,
          });
        }}
      >
        <h2 className="font-semibold">New skill</h2>
        <input
          className={input}
          name="name"
          placeholder="Skill name"
          required
        />
        <input className={input} name="description" placeholder="Description" />
        <Button disabled={action.busy}>Create skill</Button>
      </form>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const d = new FormData(event.currentTarget);
          void action.submit('/workforce/contractor-companies', {
            name: d.get('name'),
            contactName: d.get('contactName') || undefined,
            phone: d.get('phone') || undefined,
            email: d.get('email') || undefined,
          });
        }}
      >
        <h2 className="font-semibold">New contractor company</h2>
        <input
          className={input}
          name="name"
          placeholder="Company name"
          required
        />
        <input
          className={input}
          name="contactName"
          placeholder="Contact name"
        />
        <input className={input} name="phone" placeholder="Phone" />
        <input
          className={input}
          name="email"
          type="email"
          placeholder="Email"
        />
        <Button disabled={action.busy}>Create company</Button>
      </form>
      {action.message && <p className="text-sm">{action.message}</p>}
    </div>
  );
}

export function WorkerRegistrationForm({
  csrfToken,
  setup,
}: {
  csrfToken: string;
  setup: WorkerSetup;
}) {
  const action = useAction(csrfToken);
  const router = useRouter();
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        void action
          .submit('/workforce/workers', {
            fullName: d.get('fullName'),
            identityNumber: d.get('identityNumber') || undefined,
            primaryPhone: d.get('primaryPhone'),
            email: d.get('email') || undefined,
            primaryCategoryId: d.get('primaryCategoryId'),
            skillIds: d.getAll('skillIds'),
            relationship: d.get('relationship'),
            contractorCompanyId: d.get('contractorCompanyId') || undefined,
            experienceYears: Number(d.get('experienceYears')),
            serviceArea: d.get('serviceArea'),
            registrationDate: d.get('registrationDate'),
            rateNotes: d.get('rateNotes') || undefined,
          })
          .then((result) => {
            if (result?.id) router.push(`/admin/workers/${result.id}`);
          });
      }}
    >
      <input
        className={input}
        name="fullName"
        placeholder="Full name"
        required
      />
      <input
        className={input}
        name="identityNumber"
        placeholder="Identity number"
      />
      <input
        className={input}
        name="primaryPhone"
        placeholder="Primary phone"
        required
      />
      <input className={input} name="email" type="email" placeholder="Email" />
      <select className={input} name="primaryCategoryId" required>
        {setup.categories
          .filter((c) => c.active)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>
      <select className={input} name="skillIds" multiple required>
        {setup.skills
          .filter((s) => s.active)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
      </select>
      <select className={input} name="relationship">
        <option>INTERNAL</option>
        <option>EXTERNAL_CONTRACTOR</option>
      </select>
      <select className={input} name="contractorCompanyId">
        <option value="">No contractor company</option>
        {setup.contractorCompanies
          .filter((c) => c.active)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>
      <input
        className={input}
        name="experienceYears"
        type="number"
        min="0"
        defaultValue="0"
      />
      <input
        className={input}
        name="serviceArea"
        placeholder="Service area"
        required
      />
      <input className={input} name="registrationDate" type="date" required />
      <input className={input} name="rateNotes" placeholder="Rate notes" />
      <Button disabled={action.busy}>Register worker</Button>
      {action.message && <p className="text-sm">{action.message}</p>}
    </form>
  );
}

export function SalaryGenerationForm({ csrfToken }: { csrfToken: string }) {
  const action = useAction(csrfToken);
  return (
    <form
      className="flex flex-wrap gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        void action.submit('/workforce/salaries/generate', {
          year: Number(d.get('year')),
          month: Number(d.get('month')),
        });
      }}
    >
      <input
        className={input}
        name="year"
        type="number"
        defaultValue={new Date().getFullYear()}
        required
      />
      <input
        className={input}
        name="month"
        type="number"
        min="1"
        max="12"
        defaultValue={new Date().getMonth() + 1}
        required
      />
      <Button disabled={action.busy}>Generate salaries</Button>
      {action.message && <span className="text-sm">{action.message}</span>}
    </form>
  );
}

export function AvailabilityForm({
  csrfToken,
  workerId,
}: {
  csrfToken: string;
  workerId: string;
}) {
  const action = useAction(csrfToken);
  return (
    <form
      className="grid gap-3 sm:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const d = new FormData(event.currentTarget);
        void action.submit(`/workforce/workers/${workerId}/availability`, {
          dayOfWeek: Number(d.get('dayOfWeek')),
          startMinute: Number(d.get('startMinute')),
          endMinute: Number(d.get('endMinute')),
          serviceArea: d.get('serviceArea') || undefined,
        });
      }}
    >
      <select className={input} name="dayOfWeek">
        {[
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ].map((day, index) => (
          <option key={day} value={index}>
            {day}
          </option>
        ))}
      </select>
      <input
        className={input}
        name="startMinute"
        type="number"
        min="0"
        max="1439"
        placeholder="Start minute"
        required
      />
      <input
        className={input}
        name="endMinute"
        type="number"
        min="1"
        max="1440"
        placeholder="End minute"
        required
      />
      <input className={input} name="serviceArea" placeholder="Service area" />
      <Button disabled={action.busy}>Add availability</Button>
      {action.message && <span className="text-sm">{action.message}</span>}
    </form>
  );
}

export function LifecycleForm({
  csrfToken,
  kind,
  id,
  version,
  statuses,
}: {
  csrfToken: string;
  kind: 'staff' | 'workers';
  id: string;
  version: number;
  statuses: string[];
}) {
  const action = useAction(csrfToken);
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const status = String(data.get('status'));
        if (
          !window.confirm(
            `Confirm status change to ${status.replaceAll('_', ' ')}?`,
          )
        )
          return;
        void action.submit(`/workforce/${kind}/${id}/status/${status}`, {
          reason: data.get('reason'),
          effectiveAt: new Date(String(data.get('effectiveAt'))).toISOString(),
          version,
        });
      }}
    >
      <select className={input} name="status">
        {statuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <input
        className={input}
        name="effectiveAt"
        type="datetime-local"
        required
      />
      <input
        className={`${input} sm:col-span-2`}
        name="reason"
        minLength={3}
        maxLength={500}
        placeholder="Required reason"
        required
      />
      <Button disabled={action.busy}>Confirm lifecycle change</Button>
      {action.message && <span className="text-sm">{action.message}</span>}
    </form>
  );
}

export function SalaryRecordActions({
  csrfToken,
  recordId,
  currency,
}: {
  csrfToken: string;
  recordId: string;
  currency: string;
}) {
  const action = useAction(csrfToken);
  return (
    <div className="mt-3 space-y-3">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void action.submit(`/workforce/salaries/${recordId}/payments`, {
            amount: data.get('amount'),
            currency,
            method: data.get('method'),
            transactionReference: data.get('reference') || undefined,
            idempotencyKey: crypto.randomUUID(),
          });
        }}
      >
        <input
          className={input}
          name="amount"
          inputMode="decimal"
          placeholder="Payment amount"
          required
        />
        <select className={input} name="method">
          <option>CASH</option>
          <option>BANK_TRANSFER</option>
          <option>CHEQUE</option>
          <option>DIGITAL_TRANSFER</option>
          <option>OTHER</option>
        </select>
        <input
          className={input}
          name="reference"
          placeholder="Transaction reference"
        />
        <Button disabled={action.busy}>Record payment</Button>
      </form>
      <Button
        disabled={action.busy}
        type="button"
        onClick={() =>
          void action.submit(`/workforce/salaries/${recordId}/slips`, {})
        }
      >
        Generate salary slip
      </Button>
      {action.message && <p className="text-sm">{action.message}</p>}
    </div>
  );
}
