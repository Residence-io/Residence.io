'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/states';

export function FinancialSettingsForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const methods = String(form.get('supportedPaymentMethods'))
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const body = {
      defaultMonthlyFee: form.get('defaultMonthlyFee'),
      dueDay: Number(form.get('dueDay')),
      gracePeriodDays: Number(form.get('gracePeriodDays')),
      lateFeePolicy: {
        type: form.get('lateFeeType'),
        value: String(form.get('lateFeeValue')),
      },
      allocationStrategy: form.get('allocationStrategy'),
      receiptPrefix: form.get('receiptPrefix'),
      receiptSequenceStart: Number(form.get('receiptSequenceStart')),
      paymentInstructions: form.get('paymentInstructions'),
      supportedPaymentMethods: methods,
      bankTransferInstructions: form.get('bankTransferInstructions'),
      advancePaymentPolicy: { allowed: form.get('advanceAllowed') === 'on' },
      refundAndReversalPolicy: { requiresApproval: true },
      currency: form.get('currency'),
      roundingScale: Number(form.get('roundingScale')),
      effectiveFrom: form.get('effectiveFrom'),
      effectiveTo: form.get('effectiveTo') || undefined,
    };
    const response = await fetch(`${API_URL}/settings/financial`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(result?.message ?? 'Financial settings could not be created.');
      setBusy(false);
      return;
    }
    (event.currentTarget as HTMLFormElement).reset();
    setBusy(false);
    router.refresh();
  }
  const fields = [
    ['defaultMonthlyFee', 'Default monthly fee', 'number'],
    ['dueDay', 'Due day (1–28)', 'number'],
    ['gracePeriodDays', 'Grace period days', 'number'],
    ['lateFeeType', 'Late-fee type', 'text'],
    ['lateFeeValue', 'Late-fee value', 'number'],
    ['receiptPrefix', 'Receipt prefix', 'text'],
    ['receiptSequenceStart', 'Receipt sequence start', 'number'],
    ['currency', 'Currency', 'text'],
    ['roundingScale', 'Rounding scale', 'number'],
    ['effectiveFrom', 'Effective from', 'date'],
    ['effectiveTo', 'Effective to (optional)', 'date'],
    ['supportedPaymentMethods', 'Supported methods (comma-separated)', 'text'],
    ['paymentInstructions', 'Payment instructions', 'text'],
    ['bankTransferInstructions', 'Bank-transfer instructions', 'text'],
  ] as const;
  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <Alert>{error}</Alert> : null}
      <input name="allocationStrategy" type="hidden" value="OLDEST_DUE_FIRST" />
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([name, label, type]) => (
          <FormField key={name} label={label} htmlFor={name}>
            <Input
              id={name}
              name={name}
              type={type}
              required={
                !['effectiveTo', 'bankTransferInstructions'].includes(name)
              }
              defaultValue={
                name === 'receiptSequenceStart'
                  ? '1'
                  : name === 'roundingScale'
                    ? '2'
                    : name === 'currency'
                      ? 'PKR'
                      : name === 'dueDay'
                        ? '10'
                        : name === 'gracePeriodDays'
                          ? '5'
                          : name === 'lateFeeType'
                            ? 'NONE'
                            : undefined
              }
            />
          </FormField>
        ))}
      </div>
      <label className="flex gap-3 text-sm font-semibold">
        <input type="checkbox" name="advanceAllowed" />
        Allow advance payments
      </label>
      <Button disabled={busy}>
        {busy ? 'Creating…' : 'Create effective period'}
      </Button>
    </form>
  );
}
