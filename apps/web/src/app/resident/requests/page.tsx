'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react';

interface ResidentReq {
  id: string;
  requestNumber: string;
  requestType: string;
  title: string;
  description?: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  issuedDocumentObjectKey?: string;
}

export default function ResidentRequestsPage() {
  const [requests, setRequests] = useState<ResidentReq[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchRequests = useCallback(() => {
    fetch('/api/proxy/resident-requests/me')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="size-3.5" /> Certificate Issued
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="size-3.5" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="size-3.5" /> Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="size-3.5" /> Under Review
          </span>
        );
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Self-Service"
          title="Requests & NOCs"
          description="Apply for certificates, clearance letters, and permissions from society management."
        />
        <Link href="/resident/requests/new" className="self-start sm:self-auto">
          <Button className="gap-2">
            <Plus className="size-4" /> New Request
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Requests' },
          { id: 'SUBMITTED', label: 'Pending' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'ISSUED', label: 'Issued' },
          { id: 'REJECTED', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="py-12 text-center">
          <FileText className="mx-auto size-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            No requests yet
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Need a residence certificate, renovation permit, or maintenance
            clearance?
          </p>
          <Link href="/resident/requests/new">
            <Button>Submit Request</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((req) => (
            <Card key={req.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {req.requestNumber}
                  </span>
                  {getStatusBadge(req.status)}
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  {req.title}
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Type:{' '}
                  <span className="font-medium text-slate-700">
                    {req.requestType.replace(/_/g, ' ')}
                  </span>
                </p>
                {req.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {req.description}
                  </p>
                )}
                {req.rejectionReason && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
                    <span className="font-semibold">Reason:</span>{' '}
                    {req.rejectionReason}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {new Date(req.submittedAt).toLocaleDateString()}
                </span>
                {req.status === 'ISSUED' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Download className="size-3.5" /> Ready
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
