'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react';

interface ResidentDoc {
  id: string;
  category: string;
  originalFileName: string;
  documentNumber?: string;
  issuedAt?: string;
  expiresAt?: string;
  verificationStatus: string;
  computedStatus: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function ResidentDocumentsPage() {
  const [documents, setDocuments] = useState<ResidentDoc[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('IDENTITY_DOCUMENT');
  const [docNumber, setDocNumber] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchDocuments = useCallback(() => {
    fetch('/api/proxy/resident-documents/me')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDocuments(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (docNumber) formData.append('documentNumber', docNumber);
      if (issuedAt) formData.append('issuedAt', issuedAt);
      if (expiresAt) formData.append('expiresAt', expiresAt);

      const res = await fetch('/api/proxy/resident-documents/me', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowUploadModal(false);
        setFile(null);
        setDocNumber('');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'IDENTITY')
      return (
        doc.category === 'IDENTITY_DOCUMENT' ||
        doc.category === 'PROFILE_PHOTOGRAPH'
      );
    if (activeTab === 'PROPERTY')
      return (
        doc.category === 'OWNERSHIP_DOCUMENT' ||
        doc.category === 'TENANCY_AGREEMENT'
      );
    return doc.category === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="size-3.5" /> Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="size-3.5" /> Rejected
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="size-3.5" /> Expiring Soon
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="size-3.5" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="size-3.5" /> Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Self-Service"
          title="My Documents"
          description="Upload and view verified identity, tenancy, and property documents."
        />
        <Button
          onClick={() => setShowUploadModal(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="size-4" /> Upload Document
        </Button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Documents' },
          { id: 'IDENTITY', label: 'Identity & CNIC' },
          { id: 'PROPERTY', label: 'Property & Tenancy' },
          { id: 'OTHER', label: 'Other Documents' },
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

      {filteredDocs.length === 0 ? (
        <Card className="py-12 text-center">
          <FileText className="mx-auto size-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            No documents found
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Upload your CNIC, lease agreement, or property proof for society
            verification.
          </p>
          <Button onClick={() => setShowUploadModal(true)}>
            Upload Document
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="size-5" />
                  </div>
                  {getStatusBadge(doc.computedStatus || doc.verificationStatus)}
                </div>
                <h4
                  className="font-semibold text-slate-900 truncate mb-1"
                  title={doc.originalFileName}
                >
                  {doc.originalFileName}
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Category:{' '}
                  <span className="font-medium text-slate-700">
                    {doc.category.replace(/_/g, ' ')}
                  </span>
                </p>
                {doc.documentNumber && (
                  <p className="text-xs text-slate-500 mb-1">
                    Doc #:{' '}
                    <span className="font-medium text-slate-700">
                      {doc.documentNumber}
                    </span>
                  </p>
                )}
                {doc.expiresAt && (
                  <p className="text-xs text-slate-500">
                    Expires: {new Date(doc.expiresAt).toLocaleDateString()}
                  </p>
                )}
                {doc.rejectionReason && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
                    <span className="font-semibold">Reason:</span>{' '}
                    {doc.rejectionReason}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Upload New Document
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCategory(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="IDENTITY_DOCUMENT">Identity / CNIC</option>
                  <option value="TENANCY_AGREEMENT">Tenancy Agreement</option>
                  <option value="OWNERSHIP_DOCUMENT">Ownership Proof</option>
                  <option value="PROFILE_PHOTOGRAPH">Photograph</option>
                  <option value="OTHER">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Number (Optional)
                </label>
                <Input
                  placeholder="e.g. 42101-1234567-1"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issued Date
                  </label>
                  <Input
                    type="date"
                    value={issuedAt}
                    onChange={(e) => setIssuedAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select File (PDF / PNG / JPEG)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={submitting || !file}>
                  {submitting ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
