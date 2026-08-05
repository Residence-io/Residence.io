export interface FinanceDashboard {
  currency: string;
  totalReceived: string;
  confirmedPayments: number;
  pendingVerification: number;
  pendingDues: number;
  overdueDues: number;
  outstanding: string;
  nextDueDate: string | null;
}
export interface FeePlan {
  id: string;
  name: string;
  scope: string;
  monthlyBaseAmount: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  dueDay: number;
  gracePeriodDays: number;
  lateFeeType: string;
  active: boolean;
}
export interface Due {
  id: string;
  status: string;
  currency: string;
  totalAmount: string;
  paidAmount: string;
  waivedAmount: string;
  dueDate: string;
  resident?: { residentNumber: string; fullName: string };
  billingPeriod: { year: number; month: number };
}
export interface LedgerEntry {
  id: string;
  type: string;
  direction: string;
  amount: string;
  currency: string;
  eventDate: string;
  reference: string;
  description: string;
}
export interface LedgerResponse {
  items: LedgerEntry[];
  total: number;
  balance: string;
  advanceCredit: string;
}
export interface PaymentDetail {
  id: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  paymentDate: string;
  transactionReference?: string;
  resident: { id: string; residentNumber: string; fullName: string };
  receipt?: { id: string; receiptNumber: string; status: string };
}
