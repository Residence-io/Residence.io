'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BankingPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [iban, setIban] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [depositInstructions, setDepositInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const loadAccounts = useCallback(() => {
    fetch('/api/proxy/finance/banking/accounts')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any) => {
        setAccounts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setAccounts([]);
      });
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/proxy/finance/banking/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName,
          accountTitle,
          accountNumberMasked,
          iban: iban || undefined,
          openingBalance: Number(openingBalance),
          depositInstructions: depositInstructions || undefined,
          isDefault,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create bank account');
      }
      setShowModal(false);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to create bank account');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          eyebrow="Finance"
          title="Society Bank Accounts"
          description="Manage institutional bank accounts and resident payment deposit instructions."
        />
        <Button onClick={() => setShowModal(true)}>+ Add Bank Account</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <Card key={acc.id} className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-base">{acc.bankName}</h4>
                <p className="text-xs text-slate-500">
                  Title: {acc.accountTitle}
                </p>
              </div>
              {acc.isDefault && (
                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 font-semibold">
                  Default
                </span>
              )}
            </div>
            <div className="border-t pt-2 space-y-1 text-sm">
              <p>
                <span className="text-slate-500">Account No:</span>{' '}
                <span className="font-mono">{acc.accountNumberMasked}</span>
              </p>
              {acc.iban && (
                <p>
                  <span className="text-slate-500">IBAN:</span>{' '}
                  <span className="font-mono">{acc.iban}</span>
                </p>
              )}
              <p>
                <span className="text-slate-500">Current Ledger Balance:</span>{' '}
                <span className="font-bold text-green-700 font-mono">
                  {acc.currency} {Number(acc.currentBalance).toFixed(2)}
                </span>
              </p>
            </div>
            {acc.depositInstructions && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border">
                {acc.depositInstructions}
              </p>
            )}
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 bg-white space-y-4">
            <h3 className="text-lg font-bold">Add Society Bank Account</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Bank Name *</label>
                <Input
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Account Title *</label>
                <Input
                  required
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">
                  Masked Account Number *
                </label>
                <Input
                  required
                  value={accountNumberMasked}
                  onChange={(e) => setAccountNumberMasked(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">IBAN</label>
                <Input value={iban} onChange={(e) => setIban(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold">Opening Balance</label>
                <Input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">
                  Deposit Instructions
                </label>
                <Input
                  value={depositInstructions}
                  onChange={(e) => setDepositInstructions(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultAcc"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <label htmlFor="defaultAcc" className="text-xs font-semibold">
                  Set as default account
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
