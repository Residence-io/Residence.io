'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ReconciliationPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [lines, setLines] = useState<any[]>([]);
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('statement.csv');

  const loadData = useCallback(() => {
    fetch('/api/proxy/finance/banking/accounts')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any) => {
        const accList = Array.isArray(data) ? data : [];
        setAccounts(accList);
        if (accList.length > 0) {
          const id = selectedAccountId || accList[0].id;
          if (!selectedAccountId) setSelectedAccountId(id);
          return fetch(
            `/api/proxy/finance/reconciliation/lines?bankAccountId=${id}`,
          ).then((r) => (r.ok ? r.json() : []));
        }
        return [];
      })
      .then((data: any) => {
        setLines(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setLines([]);
      });
  }, [selectedAccountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent || !selectedAccountId) return;
    try {
      const res = await fetch('/api/proxy/finance/reconciliation/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountId: selectedAccountId,
          fileName,
          csvContent,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Import failed');
      }
      setCsvContent('');
      alert('Bank statement imported successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Import failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Bank Reconciliation"
        description="Import bank statement CSVs, match transactions against posted payments & expenses, and complete periodic reconciliations."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-4">
          <h3 className="font-bold text-sm text-slate-700">
            Import Statement CSV
          </h3>
          <div>
            <label className="text-xs font-semibold">Bank Account</label>
            <select
              className="w-full border rounded p-2 text-sm"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} ({acc.accountNumberMasked})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">File Name</label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold">
              Paste CSV Text (Date, Description, Ref, Debit, Credit, Balance)
            </label>
            <textarea
              rows={5}
              className="w-full border rounded p-2 text-xs font-mono"
              placeholder="Date,Description,Reference,Debit,Credit,Balance&#10;2026-08-01,Resident Dues,TX-100,0,5000,5000"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
            />
          </div>
          <Button onClick={handleImport} className="w-full">
            Import Statement
          </Button>
        </Card>

        <Card className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-base">
            Unmatched Bank Statement Transactions
          </h3>
          {lines.length === 0 ? (
            <p className="text-sm text-slate-500">
              No imported statement transactions found for this account.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Ref</th>
                    <th className="p-3">Debit</th>
                    <th className="p-3">Credit</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="p-3">
                        {new Date(l.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium">{l.description}</td>
                      <td className="p-3 font-mono text-xs">
                        {l.reference || '—'}
                      </td>
                      <td className="p-3 font-mono">
                        {Number(l.debit) > 0 ? l.debit : '—'}
                      </td>
                      <td className="p-3 font-mono text-green-700 font-semibold">
                        {Number(l.credit) > 0 ? l.credit : '—'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-800 font-medium">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
