/**
 * Phase S3 — api schema view types
 *
 * These types represent the safe, RLS-enforced views in the `api` schema.
 * Sensitive columns (identity_ciphertext, object_key, etc.) are excluded.
 * Generated manually; will be replaced by Supabase CLI introspection in S8.
 */

export interface ApiProperty {
  id: string;
  society_id: string;
  block: string;
  street: string | null;
  property_number: string;
  type: 'HOUSE' | 'APARTMENT' | 'PLOT' | 'COMMERCIAL' | 'OTHER';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiUnit {
  id: string;
  property_id: string;
  society_id: string;
  unit_number: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'INACTIVE' | 'ARCHIVED';
  parking_information: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResident {
  id: string;
  society_id: string;
  user_id: string | null;
  resident_number: string;
  full_name: string;
  guardian_name: string | null;
  date_of_birth: string | null;
  gender: 'FEMALE' | 'MALE' | 'OTHER' | 'UNDISCLOSED';
  email: string | null;
  primary_phone: string;
  alternate_phone: string | null;
  identity_last_four: string | null;
  permanent_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  household_size: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'MOVED_OUT' | 'INACTIVE' | 'ARCHIVED';
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResidentOccupancy {
  id: string;
  resident_id: string;
  unit_id: string;
  occupancy_type: 'OWNER' | 'TENANT';
  primary_resident: boolean;
  start_date: string;
  end_date: string | null;
  move_out_reason: string | null;
  property_owner_name: string | null;
  property_owner_phone: string | null;
  property_owner_email: string | null;
  tenancy_start_date: string | null;
  tenancy_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiHouseholdMember {
  id: string;
  resident_id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: 'FEMALE' | 'MALE' | 'OTHER' | 'UNDISCLOSED';
  phone: string | null;
  identity_last_four: string | null;
  emergency_contact: boolean;
  status: 'ACTIVE' | 'MOVED_OUT' | 'INACTIVE';
  moved_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiVehicle {
  id: string;
  society_id: string;
  resident_id: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  colour: string | null;
  registration_number: string;
  parking_permit_number: string | null;
  parking_location: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResidentIdCard {
  id: string;
  resident_id: string;
  card_number: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
}
