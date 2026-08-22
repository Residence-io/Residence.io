'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function AdminPollsDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [poll, setPoll] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadPollAndResults = () => {
    if (!id) return;
    Promise.all([
      fetch(`/api/proxy/admin/polls/${id}`).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`/api/proxy/admin/polls/${id}/results`).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([pollData, resultsData]) => {
        setPoll(pollData);
        setResults(resultsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPollAndResults();
  }, [id]);

  const handlePublish = async () => {
    await fetch(`/api/proxy/admin/polls/${id}/publish`, { method: 'POST' });
    loadPollAndResults();
  };

  const handleClose = async () => {
    await fetch(`/api/proxy/admin/polls/${id}/close`, { method: 'POST' });
    loadPollAndResults();
  };

  if (loading)
    return (
      <div className="text-center py-12 text-slate-500">Loading poll...</div>
    );
  if (!poll)
    return (
      <div className="text-center py-12 text-slate-500">Poll not found</div>
    );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/community/polls"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Back to Polls
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            {poll.type}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {poll.title}
          </h1>
          <p className="text-sm text-slate-500">
            Status: {poll.status} • Eligibility:{' '}
            {poll.eligibility.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="flex gap-2">
          {poll.status === 'DRAFT' && (
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
            >
              Publish Poll
            </button>
          )}
          {poll.status === 'OPEN' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
            >
              Close Poll
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Voting Results
            </h2>
            <div className="text-sm text-slate-500">
              Total votes cast:{' '}
              <span className="font-bold text-slate-900">
                {results?.totalVotes || 0}
              </span>
            </div>

            <div className="space-y-4">
              {results?.options?.map((opt: any) => (
                <div key={opt.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-800">
                      {opt.label}
                    </span>
                    <span className="font-bold text-slate-900">
                      {opt.voteCount} votes ({opt.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-3 text-sm">
            <h3 className="font-bold text-slate-900">Poll Information</h3>
            <div>
              <span className="text-xs text-slate-500 block">
                Voting Window
              </span>
              <span className="text-slate-800 font-medium">
                {new Date(poll.opensAt).toLocaleString()} &ndash;{' '}
                {new Date(poll.closesAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">
                Anonymous Ballots
              </span>
              <span className="text-slate-800 font-medium">
                {poll.anonymous ? 'Yes (Voter IDs protected)' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Created By</span>
              <span className="text-slate-800 font-medium">
                {poll.createdByUser?.fullName || 'Admin'}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
