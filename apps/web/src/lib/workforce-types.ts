export interface Department {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  jobTitles: Array<{ id: string; name: string; active: boolean }>;
}
export interface StaffSummary {
  id: string;
  staffNumber: string;
  fullName: string;
  primaryPhone: string;
  email?: string;
  status: string;
  maskedIdentity?: string;
  version: number;
  employments: Array<{
    id: string;
    employmentType: string;
    joiningDate: string;
    department: { id: string; name: string };
    jobTitle: { id: string; name: string };
  }>;
  salaryStructures?: Array<Record<string, unknown>>;
  salaryRecords?: SalaryRecord[];
  documents?: Array<Record<string, unknown>>;
  statusHistory?: Array<Record<string, unknown>>;
}
export interface WorkerSetup {
  categories: Array<{
    id: string;
    code: string;
    name: string;
    active: boolean;
  }>;
  skills: Array<{ id: string; name: string; active: boolean }>;
  contractorCompanies: Array<{ id: string; name: string; active: boolean }>;
}
export interface WorkerSummary {
  id: string;
  workerNumber: string;
  fullName: string;
  primaryPhone: string;
  serviceArea: string;
  status: string;
  relationship: string;
  version: number;
  primaryCategory: { id: string; name: string };
  contractorCompany?: { name: string };
  skills: Array<{ skill: { id: string; name: string } }>;
  availability?: Array<Record<string, unknown>>;
  reservations?: Array<Record<string, unknown>>;
  performanceNotes?: Array<Record<string, unknown>>;
}
export interface SalaryRecord {
  id: string;
  basicSalary: string;
  allowances: string;
  deductions: string;
  adjustmentTotal: string;
  netPayable: string;
  amountPaid: string;
  currency: string;
  status: string;
  staff: StaffSummary;
  salaryPeriod: { year: number; month: number };
  payments: Array<{
    id: string;
    amount: string;
    method: string;
    status: string;
  }>;
  slips: Array<{ id: string; slipNumber: string; status: string }>;
}
export interface WorkforceDashboard {
  totalStaff: number;
  activeStaff: number;
  salaryPaid: string;
  pendingSalary: string;
  availableWorkers: number;
  busyWorkers: number;
  workersOnLeave: number;
}
