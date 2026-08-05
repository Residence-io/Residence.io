export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  workerCategoryId?: string;
  requiredSkillId?: string;
}
export interface TicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  privacy?: string;
  createdAt: string;
  targetResolutionAt?: string;
  category: TicketCategory;
  resident?: { id: string; residentNumber: string; fullName: string };
  version: number;
}
export interface TicketDetail extends TicketSummary {
  description: string;
  location?: string;
  exactLocation?: string;
  accessInstructions?: string;
  messages: Array<{
    id: string;
    body: string;
    visibility: string;
    createdAt: string;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus?: string;
    toStatus: string;
    residentExplanation?: string;
    createdAt: string;
  }>;
  attachments: Array<{
    id: string;
    mediaType: string;
    sizeBytes: string;
    createdAt: string;
  }>;
  assignments?: Array<{
    id: string;
    status: string;
    worker: {
      id: string;
      workerNumber: string;
      fullName: string;
      primaryCategory: { name: string };
    };
  }>;
  appointments?: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
  }>;
  resolution?: { residentSummary: string; residentConfirmedAt?: string };
  rating?: { overall: number };
}
export interface TicketPage {
  items: TicketSummary[];
  total: number;
  page: number;
  pageSize: number;
}
export interface TicketDashboard {
  openComplaints: number;
  activeMaintenance: number;
  unassigned: number;
  urgent: number;
  overdue: number;
  todayAppointments: number;
}
