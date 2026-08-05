export interface Occupancy {
  id: string;
  occupancyType: 'OWNER' | 'TENANT';
  startDate: string;
  endDate: string | null;
  unit: {
    id: string;
    unitNumber: string;
    property: {
      id: string;
      block: string;
      street?: string;
      propertyNumber: string;
      type: string;
    };
  };
}
export interface ResidentSummary {
  id: string;
  residentNumber: string;
  fullName: string;
  primaryPhone: string;
  email?: string;
  status: string;
  version: number;
  identityNumber?: string | null;
  maskedIdentityNumber?: string;
  society?: { name: string };
  user?: {
    id: string;
    username: string;
    email?: string;
    status: string;
    forcePasswordChange: boolean;
    lastLoginAt?: string;
  } | null;
  occupancies: Occupancy[];
}
export interface ResidentDetail extends ResidentSummary {
  guardianName?: string;
  dateOfBirth?: string;
  gender: string;
  alternatePhone?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  householdSize: number;
  profilePhotograph?: {
    id: string;
    status: string;
    originalFileName: string;
    mediaType: string;
    sizeBytes: number;
    createdAt: string;
  } | null;
  householdMembers: Array<{
    id: string;
    fullName: string;
    age?: number;
    relationship?: string;
    status?: string;
    phone?: string;
  }>;
  vehicles: Array<{
    id: string;
    type: string;
    name?: string;
    registrationNumber: string;
    active: boolean;
  }>;
  documents: Array<{
    id: string;
    category: string;
    status: string;
    originalFileName: string;
    mediaType: string;
    sizeBytes: number;
    createdAt: string;
  }>;
  idCards: Array<{
    id: string;
    cardNumber: string;
    status: string;
    issuedAt: string;
    expiresAt?: string;
  }>;
  feeAssignments: Array<{
    monthlyAmount: string;
    securityDeposit?: string;
    currency: string;
    effectiveFrom: string;
  }>;
  auditHistory?: Array<{
    id: string;
    action: string;
    createdAt: string;
    reason?: string;
  }>;
}
export interface ResidentPage {
  items: ResidentSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
export interface PropertyRecord {
  id: string;
  block: string;
  street?: string;
  propertyNumber: string;
  type: string;
  units: Array<{
    id: string;
    unitNumber: string;
    status: string;
    occupancies?: Array<{ residentId: string; occupancyType: string }>;
  }>;
}
