'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import type { PropertyRecord } from '@/lib/resident-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const field = 'w-full rounded-xl border border-slate-300 px-3 py-2';
const birthMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const birthYears = Array.from(
  { length: 120 },
  (_, index) => new Date().getFullYear() - index,
);
const residenceYears = Array.from(
  { length: 140 },
  (_, index) => new Date().getFullYear() + 20 - index,
);

function RequiredDateSelect({ label, name }: { label: string; name: string }) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="grid grid-cols-[0.8fr_1.2fr_1fr] gap-2">
        <select
          aria-label={`${label} day`}
          className={field}
          value={day}
          onChange={(event) => setDay(event.target.value)}
          required
        >
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, index) => index + 1).map(
            (dateDay) => (
              <option key={dateDay} value={String(dateDay).padStart(2, '0')}>
                {dateDay}
              </option>
            ),
          )}
        </select>
        <select
          aria-label={`${label} month`}
          className={field}
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          required
        >
          <option value="">Month</option>
          {birthMonths.map((dateMonth, index) => (
            <option key={dateMonth} value={String(index + 1).padStart(2, '0')}>
              {dateMonth}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} year`}
          className={field}
          value={year}
          onChange={(event) => setYear(event.target.value)}
          required
        >
          <option value="">Year</option>
          {residenceYears.map((dateYear) => (
            <option key={dateYear} value={dateYear}>
              {dateYear}
            </option>
          ))}
        </select>
      </div>
      <input
        type="hidden"
        name={name}
        value={day && month && year ? `${year}-${month}-${day}` : ''}
      />
    </fieldset>
  );
}

type Review = {
  fullName: string;
  cnic: string;
  email: string;
  phone: string;
  unit: string;
  ownership: string;
  moveInDate: string;
  houseMembers: string;
  monthlyFee: string;
};

export function generateTemporaryPassword() {
  const groups = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%&*?',
  ];
  const random = new Uint32Array(24);
  crypto.getRandomValues(random);
  const characters = groups.map(
    (group, index) => group[random[index]! % group.length]!,
  );
  const all = groups.join('');
  for (let index = 4; index < 20; index += 1)
    characters.push(all[random[index]! % all.length]!);
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const target = random[index + 4]! % (index + 1);
    [characters[index], characters[target]] = [
      characters[target]!,
      characters[index]!,
    ];
  }
  return characters.join('');
}

function maskCnic(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 13 ? `*****-*******-${digits.slice(-1)}` : '—';
}

export function ResidentRegistrationForm({
  properties,
  csrfToken,
}: {
  properties: PropertyRecord[];
  csrfToken: string;
}) {
  const [step, setStep] = useState(0);
  const [tenant, setTenant] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [username, setUsername] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const steps = ['Personal', 'Residence', 'Account and Review'];
  const unitOptions = properties.flatMap((property) =>
    property.units.map((unit) => ({
      id: unit.id,
      label: `${property.block} · ${property.propertyNumber} · ${unit.unitNumber} (${unit.status})`,
    })),
  );

  function validateStep() {
    const section = formRef.current?.querySelector<HTMLElement>(
      `[data-step="${step}"]`,
    );
    const controls =
      section?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        'input, select, textarea',
      ) ?? [];
    for (const control of controls) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return false;
      }
    }
    return true;
  }

  function captureReview() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    setReview({
      fullName: String(data.get('fullName') ?? ''),
      cnic: maskCnic(String(data.get('identityDocumentNumber') ?? '')),
      email: String(data.get('email') ?? '') || '—',
      phone: String(data.get('primaryPhone') ?? ''),
      unit: String(data.get('unitSearch') ?? '') || '—',
      ownership: tenant ? 'Rental' : 'Owner',
      moveInDate: String(data.get('moveInDate') ?? ''),
      houseMembers: String(data.get('householdSize') ?? ''),
      monthlyFee: String(data.get('monthlyFee') ?? ''),
    });
  }

  function next() {
    setError('');
    if (!validateStep()) return;
    if (step === 1) captureReview();
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  function toggleAccount(enabled: boolean) {
    setCreateAccount(enabled);
    setShowPassword(false);
    setTemporaryPassword('');
    if (!enabled) {
      setUsername('');
      setAccountEmail('');
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const body = {
      fullName: data.get('fullName'),
      dateOfBirth: data.get('dateOfBirth'),
      gender: data.get('gender'),
      email: data.get('email') || undefined,
      primaryPhone: data.get('primaryPhone'),
      alternatePhone: data.get('alternatePhone') || undefined,
      identityDocumentNumber: data.get('identityDocumentNumber'),
      emergencyContactPhone: data.get('emergencyContactPhone') || undefined,
      householdSize: Number(data.get('householdSize')),
      unitId: data.get('unitId'),
      occupancyType: tenant ? 'TENANT' : 'OWNER',
      moveInDate: data.get('moveInDate'),
      propertyOwnerName: tenant ? data.get('propertyOwnerName') : undefined,
      propertyOwnerPhone: tenant ? data.get('propertyOwnerPhone') : undefined,
      propertyOwnerEmail: tenant
        ? data.get('propertyOwnerEmail') || undefined
        : undefined,
      tenancyStartDate: tenant ? data.get('tenancyStartDate') : undefined,
      tenancyEndDate: tenant ? data.get('tenancyEndDate') : undefined,
      monthlyFee: data.get('monthlyFee'),
      account: {
        createAccount,
        username: createAccount ? data.get('username') : undefined,
        email: createAccount ? data.get('accountEmail') : undefined,
        active: createAccount && data.get('accountActive') === 'on',
        temporaryPassword: createAccount ? temporaryPassword : undefined,
      },
    };
    try {
      const agreement = data.get('tenancyAgreement');
      const multipart = new FormData();
      multipart.set('payload', JSON.stringify(body));
      if (agreement instanceof File && agreement.size)
        multipart.set('tenancyAgreement', agreement);
      const response = await fetch(
        `${API_URL}/residents${tenant ? '/register' : ''}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: tenant
            ? { 'x-csrf-token': csrfToken }
            : {
                'content-type': 'application/json',
                'x-csrf-token': csrfToken,
              },
          body: tenant ? multipart : JSON.stringify(body),
        },
      );
      const result = (await response.json()) as {
        resident?: { id: string };
        message?: string;
      };
      if (!response.ok)
        throw new Error(result.message ?? 'Resident registration failed.');
      setTemporaryPassword('');
      setShowPassword(false);
      router.push(
        `/admin/residents/${result.resident!.id}?created=1&account=${createAccount ? '1' : '0'}`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Resident registration failed.',
      );
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} className="space-y-5" onSubmit={submit}>
      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((label, index) => (
          <li
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${index === step ? 'bg-blue-700 text-white' : 'bg-slate-100'}`}
            key={label}
            aria-current={index === step ? 'step' : undefined}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {error && (
        <p
          className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      <Card hidden={step !== 0} data-step="0">
        <h2 className="font-bold">Personal information</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            Full Name
            <input className={field} name="fullName" required minLength={2} />
          </label>
          <fieldset>
            <legend>
              Date of Birth{' '}
              <span className="text-xs text-slate-500">(optional)</span>
            </legend>
            <div className="grid grid-cols-[0.8fr_1.2fr_1fr] gap-2">
              <select
                aria-label="Birth day"
                className={field}
                value={birthDay}
                onChange={(event) => setBirthDay(event.target.value)}
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, index) => index + 1).map(
                  (day) => (
                    <option key={day} value={String(day).padStart(2, '0')}>
                      {day}
                    </option>
                  ),
                )}
              </select>
              <select
                aria-label="Birth month"
                className={field}
                value={birthMonth}
                onChange={(event) => setBirthMonth(event.target.value)}
              >
                <option value="">Month</option>
                {birthMonths.map((month, index) => (
                  <option
                    key={month}
                    value={String(index + 1).padStart(2, '0')}
                  >
                    {month}
                  </option>
                ))}
              </select>
              <select
                aria-label="Birth year"
                className={field}
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value)}
              >
                <option value="">Year</option>
                {birthYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="hidden"
              name="dateOfBirth"
              value={
                birthDay && birthMonth && birthYear
                  ? `${birthYear}-${birthMonth}-${birthDay}`
                  : ''
              }
            />
          </fieldset>
          <label>
            Gender <span className="text-xs text-slate-500">(optional)</span>
            <select className={field} name="gender" defaultValue="">
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <label>
            Email
            <input className={field} type="email" name="email" />
          </label>
          <label>
            Primary Phone
            <input
              className={field}
              name="primaryPhone"
              type="tel"
              inputMode="tel"
              pattern="\+?[0-9][0-9 ()-]{6,29}"
              required
            />
          </label>
          <label>
            Alternate Phone
            <input
              className={field}
              name="alternatePhone"
              type="tel"
              inputMode="tel"
              pattern="\+?[0-9][0-9 ()-]{6,29}"
            />
          </label>
          <label>
            CNIC <span className="text-xs text-slate-500">(optional)</span>
            <input
              className={field}
              name="identityDocumentNumber"
              inputMode="numeric"
              pattern="[0-9]{5}-?[0-9]{7}-?[0-9]"
              placeholder="12345-1234567-1"
            />
          </label>
          <label>
            Emergency Phone{' '}
            <span className="text-xs text-slate-500">(optional)</span>
            <input
              className={field}
              name="emergencyContactPhone"
              type="tel"
              inputMode="tel"
              pattern="\+?[0-9][0-9 ()-]{6,29}"
            />
          </label>
        </div>
      </Card>
      <Card hidden={step !== 1} data-step="1">
        <h2 className="font-bold">Residence information</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="relative block">
            Property and Unit
            <input
              autoComplete="off"
              className={field}
              name="unitSearch"
              placeholder="e.g. A · 101 · 101"
              value={unitSearch}
              onChange={(event) => {
                const value = event.target.value;
                setUnitSearch(value);
                const match = unitOptions.find(
                  (option) => option.label === value,
                );
                setSelectedUnitId(match?.id ?? '');
                event.currentTarget.setCustomValidity(
                  value && !match
                    ? 'Select an address from the suggestions.'
                    : '',
                );
              }}
              required
            />
            {/* Custom dropdown — shows matching options as admin types */}
            {unitSearch.trim().length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg text-sm">
                {unitOptions
                  .filter((option) =>
                    option.label
                      .toLowerCase()
                      .includes(unitSearch.toLowerCase()),
                  )
                  .slice(0, 20)
                  .map((option) => (
                    <li
                      key={option.id}
                      className="cursor-pointer px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setUnitSearch(option.label);
                        setSelectedUnitId(option.id);
                      }}
                    >
                      {option.label}
                    </li>
                  ))}
                {unitOptions.filter((option) =>
                  option.label.toLowerCase().includes(unitSearch.toLowerCase()),
                ).length === 0 && (
                  <li className="px-4 py-2.5 text-slate-400">
                    No matching address found.
                  </li>
                )}
              </ul>
            )}
            <input type="hidden" name="unitId" value={selectedUnitId} />
          </label>
          <label>
            Ownership Status
            <select
              className={field}
              name="ownershipStatus"
              value={tenant ? 'TENANT' : 'OWNER'}
              onChange={(event) => setTenant(event.target.value === 'TENANT')}
            >
              <option value="OWNER">Owner</option>
              <option value="TENANT">Rental</option>
            </select>
          </label>
          <RequiredDateSelect label="Move-in Date" name="moveInDate" />
          <label>
            House Members
            <input
              className={field}
              type="number"
              name="householdSize"
              min="1"
              max="100"
              step="1"
              defaultValue="1"
              aria-describedby="house-members-help"
              required
            />
            <span id="house-members-help" className="text-xs text-slate-600">
              Total number of people living in this house.
            </span>
          </label>
          <label>
            Initial Monthly Fee
            <input
              className={field}
              name="monthlyFee"
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,4})?"
              required
            />
          </label>
        </div>
        {tenant && (
          <fieldset className="mt-5 grid gap-4 border-t pt-5 md:grid-cols-2">
            <legend className="font-semibold">Tenant information</legend>
            <label>
              Property Owner Name
              <input
                className={field}
                name="propertyOwnerName"
                required={tenant}
              />
            </label>
            <label>
              Owner Phone
              <input
                className={field}
                name="propertyOwnerPhone"
                required={tenant}
              />
            </label>
            <label>
              Owner Email
              <input className={field} type="email" name="propertyOwnerEmail" />
            </label>
            <RequiredDateSelect label="Tenancy Start" name="tenancyStartDate" />
            <RequiredDateSelect label="Tenancy End" name="tenancyEndDate" />
            <label>
              Tenancy Agreement
              <input
                className={field}
                type="file"
                name="tenancyAgreement"
                accept="application/pdf,image/png,image/jpeg"
                required={tenant}
              />
            </label>
          </fieldset>
        )}
      </Card>
      <Card hidden={step !== 2} data-step="2">
        <h2 className="font-bold">Account and Review</h2>
        <label className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            name="createAccount"
            checked={createAccount}
            onChange={(event) => toggleAccount(event.target.checked)}
          />
          Create Account
        </label>
        {createAccount && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label>
              Username
              <input
                className={field}
                name="username"
                pattern="[A-Za-z0-9._-]{3,100}"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label>
              Account Email{' '}
              <span className="text-xs text-slate-500">(optional)</span>
              <input
                className={field}
                type="email"
                name="accountEmail"
                value={accountEmail}
                onChange={(event) => setAccountEmail(event.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="accountActive" defaultChecked />
              Activate
            </label>
            <div>
              <label>
                Temporary Password
                <input
                  className={field}
                  type={showPassword ? 'text' : 'password'}
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  minLength={12}
                  autoComplete="new-password"
                  required
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={!temporaryPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
                <Button
                  type="button"
                  disabled={!temporaryPassword}
                  onClick={() =>
                    void navigator.clipboard.writeText(temporaryPassword)
                  }
                >
                  Copy
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    setTemporaryPassword(generateTemporaryPassword())
                  }
                >
                  {temporaryPassword
                    ? 'Regenerate Password'
                    : 'Generate Password'}
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 grid gap-4 border-t pt-5 md:grid-cols-2">
          <section>
            <h3 className="font-semibold">Personal</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <dt>Name</dt>
              <dd>{review?.fullName}</dd>
              <dt>CNIC</dt>
              <dd>{review?.cnic}</dd>
              <dt>Email</dt>
              <dd>{review?.email}</dd>
              <dt>Phone</dt>
              <dd>{review?.phone}</dd>
            </dl>
          </section>
          <section>
            <h3 className="font-semibold">Residence</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <dt>Property and Unit</dt>
              <dd>{review?.unit}</dd>
              <dt>Ownership</dt>
              <dd>{review?.ownership}</dd>
              <dt>Move-in Date</dt>
              <dd>{review?.moveInDate}</dd>
              <dt>House Members</dt>
              <dd>{review?.houseMembers}</dd>
              <dt>Monthly Fee</dt>
              <dd>{review?.monthlyFee}</dd>
            </dl>
          </section>
        </div>
        <p className="mt-5 text-sm text-slate-600">
          Confirm the details before submitting. The generated resident ID is
          permanent. If an account is created, its temporary password is sent
          only with this protected registration request and is never returned,
          logged, or stored in plaintext.
        </p>
      </Card>
      <div className="flex justify-between">
        <Button
          type="button"
          disabled={step === 0 || busy}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          Previous
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={next}>
            Next
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={
              busy ||
              (createAccount && !/^[A-Za-z0-9._-]{3,100}$/.test(username))
            }
          >
            {busy ? 'Registering…' : 'Register Resident'}
          </Button>
        )}
      </div>
    </form>
  );
}
