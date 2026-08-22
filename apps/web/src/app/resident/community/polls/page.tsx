'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Vote, CheckCircle2 } from 'lucide-react';

interface ResidentPoll {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  eligibility: string;
  opensAt: string;
  closesAt: string;
  hasVoted: boolean;
  options: { id: string; label: string }[];
}

export default function ResidentPollsPage() {
  const [polls, setPolls] = useState<ResidentPoll[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPolls = () => {
    fetch('/api/proxy/resident/polls')
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Resident Voting & Polls"
        description="Participate in community polls, surveys, and society resolutions."
      />

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading polls...</div>
      ) : polls.length === 0 ? (
        <Card className="text-center py-12">
          <Vote className="size-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">
            No Active Polls
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            There are currently no open polls for your unit.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {polls.map((poll) => (
            <Card
              key={poll.id}
              className="flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {poll.type}
                  </span>
                  {poll.hasVoted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      <CheckCircle2 className="size-3" /> Voted
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Action Required
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {poll.title}
                </h3>
                {poll.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {poll.description}
                  </p>
                )}
                <div className="mt-3 text-xs text-slate-400">
                  Closes: {new Date(poll.closesAt).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t">
                <Link
                  href={`/resident/community/polls/${poll.id}`}
                  className={`block w-full text-center py-2 rounded-xl text-sm font-semibold transition ${
                    poll.hasVoted
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {poll.hasVoted ? 'View Poll Details' : 'Cast Your Vote'}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
