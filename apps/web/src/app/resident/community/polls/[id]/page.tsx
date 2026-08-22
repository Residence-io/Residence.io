'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft, CheckCircle2, Vote, Lock } from 'lucide-react';

export default function ResidentPollDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [poll, setPoll] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPoll = () => {
    if (!id) return;
    fetch(`/api/proxy/resident/polls/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPoll(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadPoll();
  }, [id]);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/resident/polls/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedOption }),
      });
      if (res.ok) {
        setSuccess(true);
        loadPoll();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to submit vote');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!poll)
    return (
      <div className="text-center py-12 text-slate-500">Loading poll...</div>
    );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/resident/community/polls"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Back to Polls
      </Link>

      <Card className="space-y-6">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            {poll.type}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
              {poll.description}
            </p>
          )}
        </div>

        {success ? (
          <div className="p-6 bg-emerald-50 rounded-2xl text-center space-y-2 border border-emerald-200">
            <CheckCircle2 className="size-10 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-900">
              Vote Cast Successfully
            </h3>
            <p className="text-sm text-emerald-700">
              Your anonymous ballot has been recorded and counted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVote} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                Select an Option:
              </label>
              {poll.options?.map((opt: any) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition ${
                    selectedOption === opt.id
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pollOption"
                    value={opt.id}
                    checked={selectedOption === opt.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="size-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Lock className="size-3.5" /> Anonymous Ballot
              </span>
              <button
                type="submit"
                disabled={!selectedOption || submitting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting...' : 'Submit Vote'}
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
