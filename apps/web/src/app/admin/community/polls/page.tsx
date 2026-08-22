'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Vote } from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  type: string;
  status: string;
  eligibility: string;
  opensAt: string;
  closesAt: string;
  anonymous: boolean;
  options: { id: string; label: string }[];
  _count?: { votes: number };
}

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'GENERAL',
    eligibility: 'ALL_ACTIVE_RESIDENTS',
    opensAt: '2026-08-22T10:00',
    closesAt: '2026-08-29T10:00',
    options: ['', ''],
  });

  const loadPolls = () => {
    fetch('/api/proxy/admin/polls')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setPolls(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/proxy/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          opensAt: new Date(formData.opensAt).toISOString(),
          closesAt: new Date(formData.closesAt).toISOString(),
          options: formData.options
            .filter((o) => o.trim())
            .map((label) => ({ label })),
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        loadPolls();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Community"
          title="Polls & Voting"
          description="Create resident surveys, AGM resolutions, and community voting polls."
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          <Plus className="size-4" />
          Create Poll
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading polls...</div>
      ) : polls.length === 0 ? (
        <Card className="text-center py-12">
          <Vote className="size-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">
            No Polls Created
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Conduct society voting on resolutions, amenities, or general
            resident feedback.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <Card
              key={poll.id}
              className="flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {poll.type}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      poll.status === 'OPEN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : poll.status === 'CLOSED'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {poll.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                  {poll.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Eligibility: {poll.eligibility.replace(/_/g, ' ')}
                </p>
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <div>
                    Opens: {new Date(poll.opensAt).toLocaleDateString()}
                  </div>
                  <div>
                    Closes: {new Date(poll.closesAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {poll._count?.votes || 0} Votes
                </span>
                <Link
                  href={`/admin/community/polls/${poll.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Manage & Results &rarr;
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              Create Community Poll
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Swimming Pool Timings Revision"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="GENERAL">General Poll</option>
                  <option value="SURVEY">Survey</option>
                  <option value="RESOLUTION">Society Resolution</option>
                  <option value="AGM">AGM Question</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Eligibility *
                </label>
                <select
                  value={formData.eligibility}
                  onChange={(e) =>
                    setFormData({ ...formData, eligibility: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="ALL_ACTIVE_RESIDENTS">
                    All Active Residents
                  </option>
                  <option value="OWNERS_ONLY">Property Owners Only</option>
                  <option value="TENANTS_ONLY">Tenants Only</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Opens At *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.opensAt}
                    onChange={(e) =>
                      setFormData({ ...formData, opensAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Closes At *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.closesAt}
                    onChange={(e) =>
                      setFormData({ ...formData, closesAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Options *
                </label>
                {formData.options.map((opt, idx) => (
                  <input
                    key={idx}
                    required
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...formData.options];
                      newOpts[idx] = e.target.value;
                      setFormData({ ...formData, options: newOpts });
                    }}
                    className="w-full px-3 py-1.5 border rounded-xl text-sm mb-2"
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      options: [...formData.options, ''],
                    })
                  }
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  + Add Option
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
