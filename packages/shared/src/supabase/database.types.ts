// Generated from the local Supabase schema. Do not edit manually.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  api: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      announcement: {
        Row: {
          category: string;
          channels: Json;
          correction_of_id: string | null;
          created_at: string;
          created_by_user_id: string;
          emergency: boolean;
          expires_at: string | null;
          id: string;
          message: string;
          priority: Database['public']['Enums']['NotificationPriority'];
          publish_at: string | null;
          requires_acknowledgment: boolean;
          society_id: string;
          status: Database['public']['Enums']['AnnouncementStatus'];
          subject: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          category: string;
          channels: Json;
          correction_of_id?: string | null;
          created_at?: string;
          created_by_user_id: string;
          emergency?: boolean;
          expires_at?: string | null;
          id?: string;
          message: string;
          priority?: Database['public']['Enums']['NotificationPriority'];
          publish_at?: string | null;
          requires_acknowledgment?: boolean;
          society_id: string;
          status?: Database['public']['Enums']['AnnouncementStatus'];
          subject: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          category?: string;
          channels?: Json;
          correction_of_id?: string | null;
          created_at?: string;
          created_by_user_id?: string;
          emergency?: boolean;
          expires_at?: string | null;
          id?: string;
          message?: string;
          priority?: Database['public']['Enums']['NotificationPriority'];
          publish_at?: string | null;
          requires_acknowledgment?: boolean;
          society_id?: string;
          status?: Database['public']['Enums']['AnnouncementStatus'];
          subject?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'announcement_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      announcement_attachment: {
        Row: {
          announcement_id: string;
          archived_at: string | null;
          checksum_sha256: string;
          created_at: string;
          id: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          size_bytes: number;
          uploaded_by_user_id: string;
        };
        Insert: {
          announcement_id: string;
          archived_at?: string | null;
          checksum_sha256: string;
          created_at?: string;
          id?: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          size_bytes: number;
          uploaded_by_user_id: string;
        };
        Update: {
          announcement_id?: string;
          archived_at?: string | null;
          checksum_sha256?: string;
          created_at?: string;
          id?: string;
          media_type?: string;
          object_key?: string;
          original_file_name?: string;
          size_bytes?: number;
          uploaded_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcement_attachment_announcement_id_fkey';
            columns: ['announcement_id'];
            isOneToOne: false;
            referencedRelation: 'announcement';
            referencedColumns: ['id'];
          },
        ];
      };
      announcement_audience: {
        Row: {
          announcement_id: string;
          criteria: Json;
          exclusions: Json;
          id: string;
          type: Database['public']['Enums']['AudienceType'];
        };
        Insert: {
          announcement_id: string;
          criteria?: Json;
          exclusions?: Json;
          id?: string;
          type: Database['public']['Enums']['AudienceType'];
        };
        Update: {
          announcement_id?: string;
          criteria?: Json;
          exclusions?: Json;
          id?: string;
          type?: Database['public']['Enums']['AudienceType'];
        };
        Relationships: [
          {
            foreignKeyName: 'announcement_audience_announcement_id_fkey';
            columns: ['announcement_id'];
            isOneToOne: false;
            referencedRelation: 'announcement';
            referencedColumns: ['id'];
          },
        ];
      };
      announcement_audience_snapshot: {
        Row: {
          announcement_id: string;
          channels: Json;
          created_at: string;
          exclusion_reason: string | null;
          id: string;
          resident_id: string | null;
          user_id: string;
        };
        Insert: {
          announcement_id: string;
          channels: Json;
          created_at?: string;
          exclusion_reason?: string | null;
          id?: string;
          resident_id?: string | null;
          user_id: string;
        };
        Update: {
          announcement_id?: string;
          channels?: Json;
          created_at?: string;
          exclusion_reason?: string | null;
          id?: string;
          resident_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcement_audience_snapshot_announcement_id_fkey';
            columns: ['announcement_id'];
            isOneToOne: false;
            referencedRelation: 'announcement';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_user_id: string | null;
          correlation_id: string | null;
          created_at: string;
          id: string;
          outcome: Database['public']['Enums']['AuditOutcome'];
          reason: string | null;
          safe_metadata: Json;
          society_id: string | null;
          source_ip: string | null;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          correlation_id?: string | null;
          created_at?: string;
          id?: string;
          outcome: Database['public']['Enums']['AuditOutcome'];
          reason?: string | null;
          safe_metadata?: Json;
          society_id?: string | null;
          source_ip?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          correlation_id?: string | null;
          created_at?: string;
          id?: string;
          outcome?: Database['public']['Enums']['AuditOutcome'];
          reason?: string | null;
          safe_metadata?: Json;
          society_id?: string | null;
          source_ip?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_user_id_fkey';
            columns: ['actor_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_log_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      billing_period: {
        Row: {
          created_at: string;
          ends_at: string;
          id: string;
          month: number;
          society_id: string;
          starts_at: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          month: number;
          society_id: string;
          starts_at: string;
          year: number;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          month?: number;
          society_id?: string;
          starts_at?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'billing_period_society_fk';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      complaint: {
        Row: {
          archived_at: string | null;
          category_id: string;
          closed_at: string | null;
          created_at: string;
          description: string;
          id: string;
          location: string | null;
          preferred_contact_method: string | null;
          priority: Database['public']['Enums']['TicketPriority'];
          privacy: Database['public']['Enums']['ComplaintPrivacy'];
          property_id: string | null;
          property_snapshot: Json;
          resident_id: string;
          resident_urgency: Database['public']['Enums']['TicketPriority'];
          resolved_at: string | null;
          responded_at: string | null;
          society_id: string;
          status: Database['public']['Enums']['ComplaintStatus'];
          subject: string;
          target_resolution_at: string | null;
          target_response_at: string | null;
          ticket_number: string;
          unit_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          category_id: string;
          closed_at?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          location?: string | null;
          preferred_contact_method?: string | null;
          priority?: Database['public']['Enums']['TicketPriority'];
          privacy?: Database['public']['Enums']['ComplaintPrivacy'];
          property_id?: string | null;
          property_snapshot?: Json;
          resident_id: string;
          resident_urgency?: Database['public']['Enums']['TicketPriority'];
          resolved_at?: string | null;
          responded_at?: string | null;
          society_id: string;
          status?: Database['public']['Enums']['ComplaintStatus'];
          subject: string;
          target_resolution_at?: string | null;
          target_response_at?: string | null;
          ticket_number: string;
          unit_id?: string | null;
          updated_at: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          category_id?: string;
          closed_at?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          location?: string | null;
          preferred_contact_method?: string | null;
          priority?: Database['public']['Enums']['TicketPriority'];
          privacy?: Database['public']['Enums']['ComplaintPrivacy'];
          property_id?: string | null;
          property_snapshot?: Json;
          resident_id?: string;
          resident_urgency?: Database['public']['Enums']['TicketPriority'];
          resolved_at?: string | null;
          responded_at?: string | null;
          society_id?: string;
          status?: Database['public']['Enums']['ComplaintStatus'];
          subject?: string;
          target_resolution_at?: string | null;
          target_response_at?: string | null;
          ticket_number?: string;
          unit_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'complaint_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'complaint_category';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'property';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_unit_id_fkey';
            columns: ['unit_id'];
            isOneToOne: false;
            referencedRelation: 'unit';
            referencedColumns: ['id'];
          },
        ];
      };
      complaint_administrator_assignment: {
        Row: {
          administrator_user_id: string;
          assigned_at: string;
          assigned_by_user_id: string;
          complaint_id: string;
          ended_at: string | null;
          id: string;
          reason: string | null;
        };
        Insert: {
          administrator_user_id: string;
          assigned_at?: string;
          assigned_by_user_id: string;
          complaint_id: string;
          ended_at?: string | null;
          id?: string;
          reason?: string | null;
        };
        Update: {
          administrator_user_id?: string;
          assigned_at?: string;
          assigned_by_user_id?: string;
          complaint_id?: string;
          ended_at?: string | null;
          id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'complaint_administrator_assignment_administrator_user_id_fkey';
            columns: ['administrator_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_administrator_assignment_assigned_by_user_id_fkey';
            columns: ['assigned_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_administrator_assignment_complaint_id_fkey';
            columns: ['complaint_id'];
            isOneToOne: false;
            referencedRelation: 'complaint';
            referencedColumns: ['id'];
          },
        ];
      };
      complaint_attachment: {
        Row: {
          archived_at: string | null;
          checksum_sha256: string;
          complaint_id: string;
          created_at: string;
          id: string;
          media_type: string;
          message_id: string | null;
          object_key: string;
          original_file_name: string;
          sensitive: boolean;
          size_bytes: number;
          status: Database['public']['Enums']['TicketAttachmentStatus'];
          uploaded_by_user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          checksum_sha256: string;
          complaint_id: string;
          created_at?: string;
          id?: string;
          media_type: string;
          message_id?: string | null;
          object_key: string;
          original_file_name: string;
          sensitive?: boolean;
          size_bytes: number;
          status?: Database['public']['Enums']['TicketAttachmentStatus'];
          uploaded_by_user_id: string;
        };
        Update: {
          archived_at?: string | null;
          checksum_sha256?: string;
          complaint_id?: string;
          created_at?: string;
          id?: string;
          media_type?: string;
          message_id?: string | null;
          object_key?: string;
          original_file_name?: string;
          sensitive?: boolean;
          size_bytes?: number;
          status?: Database['public']['Enums']['TicketAttachmentStatus'];
          uploaded_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'complaint_attachment_complaint_id_fkey';
            columns: ['complaint_id'];
            isOneToOne: false;
            referencedRelation: 'complaint';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_attachment_uploaded_by_user_id_fkey';
            columns: ['uploaded_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      complaint_category: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          normalized_name: string;
          society_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          normalized_name: string;
          society_id: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          normalized_name?: string;
          society_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'complaint_category_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      complaint_message: {
        Row: {
          author_user_id: string;
          body: string;
          complaint_id: string;
          created_at: string;
          id: string;
          visibility: Database['public']['Enums']['TicketMessageVisibility'];
        };
        Insert: {
          author_user_id: string;
          body: string;
          complaint_id: string;
          created_at?: string;
          id?: string;
          visibility?: Database['public']['Enums']['TicketMessageVisibility'];
        };
        Update: {
          author_user_id?: string;
          body?: string;
          complaint_id?: string;
          created_at?: string;
          id?: string;
          visibility?: Database['public']['Enums']['TicketMessageVisibility'];
        };
        Relationships: [
          {
            foreignKeyName: 'complaint_message_author_user_id_fkey';
            columns: ['author_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_message_complaint_id_fkey';
            columns: ['complaint_id'];
            isOneToOne: false;
            referencedRelation: 'complaint';
            referencedColumns: ['id'];
          },
        ];
      };
      complaint_status_history: {
        Row: {
          acted_by_user_id: string;
          complaint_id: string;
          created_at: string;
          from_status: Database['public']['Enums']['ComplaintStatus'] | null;
          id: string;
          internal_reason: string | null;
          resident_explanation: string | null;
          to_status: Database['public']['Enums']['ComplaintStatus'];
        };
        Insert: {
          acted_by_user_id: string;
          complaint_id: string;
          created_at?: string;
          from_status?: Database['public']['Enums']['ComplaintStatus'] | null;
          id?: string;
          internal_reason?: string | null;
          resident_explanation?: string | null;
          to_status: Database['public']['Enums']['ComplaintStatus'];
        };
        Update: {
          acted_by_user_id?: string;
          complaint_id?: string;
          created_at?: string;
          from_status?: Database['public']['Enums']['ComplaintStatus'] | null;
          id?: string;
          internal_reason?: string | null;
          resident_explanation?: string | null;
          to_status?: Database['public']['Enums']['ComplaintStatus'];
        };
        Relationships: [
          {
            foreignKeyName: 'complaint_status_history_acted_by_user_id_fkey';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'complaint_status_history_complaint_id_fkey';
            columns: ['complaint_id'];
            isOneToOne: false;
            referencedRelation: 'complaint';
            referencedColumns: ['id'];
          },
        ];
      };
      consent_or_preference_history: {
        Row: {
          changed_by_user_id: string;
          changes: Json;
          created_at: string;
          id: string;
          policy_basis: string | null;
          preference_id: string;
        };
        Insert: {
          changed_by_user_id: string;
          changes: Json;
          created_at?: string;
          id?: string;
          policy_basis?: string | null;
          preference_id: string;
        };
        Update: {
          changed_by_user_id?: string;
          changes?: Json;
          created_at?: string;
          id?: string;
          policy_basis?: string | null;
          preference_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'consent_or_preference_history_preference_id_fkey';
            columns: ['preference_id'];
            isOneToOne: false;
            referencedRelation: 'notification_preference';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_disclosure_log: {
        Row: {
          acted_by_user_id: string | null;
          created_at: string;
          disclosed_fields: Json;
          id: string;
          maintenance_request_id: string;
          policy_basis: string;
          recipient_id: string;
          recipient_type: string;
        };
        Insert: {
          acted_by_user_id?: string | null;
          created_at?: string;
          disclosed_fields: Json;
          id?: string;
          maintenance_request_id: string;
          policy_basis: string;
          recipient_id: string;
          recipient_type: string;
        };
        Update: {
          acted_by_user_id?: string | null;
          created_at?: string;
          disclosed_fields?: Json;
          id?: string;
          maintenance_request_id?: string;
          policy_basis?: string;
          recipient_id?: string;
          recipient_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_disclosure_log_acted_by_user_id_fkey';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_disclosure_log_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
        ];
      };
      contractor_company: {
        Row: {
          active: boolean;
          address: string | null;
          contact_name: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          normalized_name: string;
          phone: string | null;
          society_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          address?: string | null;
          contact_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          normalized_name: string;
          phone?: string | null;
          society_id: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          address?: string | null;
          contact_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          normalized_name?: string;
          phone?: string | null;
          society_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'contractor_company_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      delivery_attempt: {
        Row: {
          attempt_number: number;
          completed_at: string | null;
          delivery_id: string;
          failure_classification:
            | Database['public']['Enums']['FailureClassification']
            | null;
          id: string;
          provider: string;
          safe_response: string | null;
          started_at: string;
          status: Database['public']['Enums']['DeliveryStatus'];
        };
        Insert: {
          attempt_number: number;
          completed_at?: string | null;
          delivery_id: string;
          failure_classification?:
            | Database['public']['Enums']['FailureClassification']
            | null;
          id?: string;
          provider: string;
          safe_response?: string | null;
          started_at: string;
          status: Database['public']['Enums']['DeliveryStatus'];
        };
        Update: {
          attempt_number?: number;
          completed_at?: string | null;
          delivery_id?: string;
          failure_classification?:
            | Database['public']['Enums']['FailureClassification']
            | null;
          id?: string;
          provider?: string;
          safe_response?: string | null;
          started_at?: string;
          status?: Database['public']['Enums']['DeliveryStatus'];
        };
        Relationships: [
          {
            foreignKeyName: 'delivery_attempt_delivery_id_fkey';
            columns: ['delivery_id'];
            isOneToOne: false;
            referencedRelation: 'notification_delivery';
            referencedColumns: ['id'];
          },
        ];
      };
      department: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          normalized_name: string;
          society_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name: string;
          normalized_name: string;
          society_id: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name?: string;
          normalized_name?: string;
          society_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'department_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      discount_or_waiver: {
        Row: {
          acted_by_user_id: string;
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          idempotency_key: string;
          monthly_due_id: string;
          reason: string;
          type: Database['public']['Enums']['AdjustmentType'];
        };
        Insert: {
          acted_by_user_id: string;
          amount: number;
          created_at?: string;
          currency: string;
          id?: string;
          idempotency_key: string;
          monthly_due_id: string;
          reason: string;
          type: Database['public']['Enums']['AdjustmentType'];
        };
        Update: {
          acted_by_user_id?: string;
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string;
          monthly_due_id?: string;
          reason?: string;
          type?: Database['public']['Enums']['AdjustmentType'];
        };
        Relationships: [
          {
            foreignKeyName: 'discount_waiver_actor_fk';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'discount_waiver_due_fk';
            columns: ['monthly_due_id'];
            isOneToOne: false;
            referencedRelation: 'monthly_due';
            referencedColumns: ['id'];
          },
        ];
      };
      due_line_item: {
        Row: {
          amount: number;
          calculation_snapshot: Json | null;
          created_at: string;
          description: string;
          id: string;
          idempotency_key: string;
          monthly_due_id: string;
          type: Database['public']['Enums']['DueLineItemType'];
        };
        Insert: {
          amount: number;
          calculation_snapshot?: Json | null;
          created_at?: string;
          description: string;
          id?: string;
          idempotency_key: string;
          monthly_due_id: string;
          type: Database['public']['Enums']['DueLineItemType'];
        };
        Update: {
          amount?: number;
          calculation_snapshot?: Json | null;
          created_at?: string;
          description?: string;
          id?: string;
          idempotency_key?: string;
          monthly_due_id?: string;
          type?: Database['public']['Enums']['DueLineItemType'];
        };
        Relationships: [
          {
            foreignKeyName: 'due_line_item_due_fk';
            columns: ['monthly_due_id'];
            isOneToOne: false;
            referencedRelation: 'monthly_due';
            referencedColumns: ['id'];
          },
        ];
      };
      employment_record: {
        Row: {
          bank_details_ciphertext: string | null;
          created_at: string;
          department_id: string;
          effective_from: string;
          effective_to: string | null;
          employment_type: Database['public']['Enums']['EmploymentType'];
          id: string;
          job_title_id: string;
          joining_date: string;
          notes: string | null;
          payment_method:
            | Database['public']['Enums']['SalaryPaymentMethod']
            | null;
          probation_end_date: string | null;
          staff_id: string;
          supervisor_staff_id: string | null;
          updated_at: string;
          version: number;
          work_shift: string | null;
        };
        Insert: {
          bank_details_ciphertext?: string | null;
          created_at?: string;
          department_id: string;
          effective_from: string;
          effective_to?: string | null;
          employment_type: Database['public']['Enums']['EmploymentType'];
          id?: string;
          job_title_id: string;
          joining_date: string;
          notes?: string | null;
          payment_method?:
            | Database['public']['Enums']['SalaryPaymentMethod']
            | null;
          probation_end_date?: string | null;
          staff_id: string;
          supervisor_staff_id?: string | null;
          updated_at: string;
          version?: number;
          work_shift?: string | null;
        };
        Update: {
          bank_details_ciphertext?: string | null;
          created_at?: string;
          department_id?: string;
          effective_from?: string;
          effective_to?: string | null;
          employment_type?: Database['public']['Enums']['EmploymentType'];
          id?: string;
          job_title_id?: string;
          joining_date?: string;
          notes?: string | null;
          payment_method?:
            | Database['public']['Enums']['SalaryPaymentMethod']
            | null;
          probation_end_date?: string | null;
          staff_id?: string;
          supervisor_staff_id?: string | null;
          updated_at?: string;
          version?: number;
          work_shift?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'employment_record_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'department';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_record_job_title_id_fkey';
            columns: ['job_title_id'];
            isOneToOne: false;
            referencedRelation: 'job_title';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_record_staff_id_fkey';
            columns: ['staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff_member';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'employment_record_supervisor_staff_id_fkey';
            columns: ['supervisor_staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff_member';
            referencedColumns: ['id'];
          },
        ];
      };
      escalation_record: {
        Row: {
          complaint_id: string | null;
          created_at: string;
          escalation_role_code: string;
          id: string;
          idempotency_key: string;
          kind: Database['public']['Enums']['EscalationKind'];
          maintenance_request_id: string | null;
        };
        Insert: {
          complaint_id?: string | null;
          created_at?: string;
          escalation_role_code: string;
          id?: string;
          idempotency_key: string;
          kind: Database['public']['Enums']['EscalationKind'];
          maintenance_request_id?: string | null;
        };
        Update: {
          complaint_id?: string | null;
          created_at?: string;
          escalation_role_code?: string;
          id?: string;
          idempotency_key?: string;
          kind?: Database['public']['Enums']['EscalationKind'];
          maintenance_request_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'escalation_record_complaint_id_fkey';
            columns: ['complaint_id'];
            isOneToOne: false;
            referencedRelation: 'complaint';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'escalation_record_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
        ];
      };
      fee_plan: {
        Row: {
          active: boolean;
          created_at: string;
          created_by_user_id: string;
          currency: string;
          description: string | null;
          due_day: number;
          effective_from: string;
          effective_to: string | null;
          grace_period_days: number;
          id: string;
          late_fee_recurring: boolean;
          late_fee_type: Database['public']['Enums']['LateFeeType'];
          late_fee_value: number;
          monthly_base_amount: number;
          name: string;
          property_type: Database['public']['Enums']['PropertyType'] | null;
          scope: Database['public']['Enums']['FeePlanScope'];
          society_id: string;
          unit_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          created_by_user_id: string;
          currency: string;
          description?: string | null;
          due_day?: number;
          effective_from: string;
          effective_to?: string | null;
          grace_period_days?: number;
          id?: string;
          late_fee_recurring?: boolean;
          late_fee_type?: Database['public']['Enums']['LateFeeType'];
          late_fee_value?: number;
          monthly_base_amount: number;
          name: string;
          property_type?: Database['public']['Enums']['PropertyType'] | null;
          scope: Database['public']['Enums']['FeePlanScope'];
          society_id: string;
          unit_id?: string | null;
          updated_at: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          created_by_user_id?: string;
          currency?: string;
          description?: string | null;
          due_day?: number;
          effective_from?: string;
          effective_to?: string | null;
          grace_period_days?: number;
          id?: string;
          late_fee_recurring?: boolean;
          late_fee_type?: Database['public']['Enums']['LateFeeType'];
          late_fee_value?: number;
          monthly_base_amount?: number;
          name?: string;
          property_type?: Database['public']['Enums']['PropertyType'] | null;
          scope?: Database['public']['Enums']['FeePlanScope'];
          society_id?: string;
          unit_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fee_plan_creator_fk';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fee_plan_society_fk';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fee_plan_unit_fk';
            columns: ['unit_id'];
            isOneToOne: false;
            referencedRelation: 'unit';
            referencedColumns: ['id'];
          },
        ];
      };
      fee_plan_component: {
        Row: {
          amount: number;
          created_at: string;
          fee_plan_id: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          amount: number;
          created_at?: string;
          fee_plan_id: string;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          amount?: number;
          created_at?: string;
          fee_plan_id?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fee_plan_component_plan_fk';
            columns: ['fee_plan_id'];
            isOneToOne: false;
            referencedRelation: 'fee_plan';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_batch: {
        Row: {
          billing_period_id: string;
          completed_at: string | null;
          created_at: string;
          created_by_user_id: string;
          failed_count: number;
          generated_count: number;
          id: string;
          idempotency_key: string;
          skipped_count: number;
          society_id: string;
          status: Database['public']['Enums']['FinancialBatchStatus'];
        };
        Insert: {
          billing_period_id: string;
          completed_at?: string | null;
          created_at?: string;
          created_by_user_id: string;
          failed_count?: number;
          generated_count?: number;
          id?: string;
          idempotency_key: string;
          skipped_count?: number;
          society_id: string;
          status?: Database['public']['Enums']['FinancialBatchStatus'];
        };
        Update: {
          billing_period_id?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by_user_id?: string;
          failed_count?: number;
          generated_count?: number;
          id?: string;
          idempotency_key?: string;
          skipped_count?: number;
          society_id?: string;
          status?: Database['public']['Enums']['FinancialBatchStatus'];
        };
        Relationships: [
          {
            foreignKeyName: 'financial_batch_actor_fk';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_batch_period_fk';
            columns: ['billing_period_id'];
            isOneToOne: false;
            referencedRelation: 'billing_period';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_batch_society_fk';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_ledger_entry: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          description: string;
          direction: Database['public']['Enums']['LedgerDirection'];
          event_date: string;
          id: string;
          idempotency_key: string;
          monthly_due_id: string | null;
          payment_id: string | null;
          reference: string;
          resident_id: string;
          reverses_entry_id: string | null;
          society_id: string;
          type: Database['public']['Enums']['LedgerEntryType'];
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency: string;
          description: string;
          direction: Database['public']['Enums']['LedgerDirection'];
          event_date: string;
          id?: string;
          idempotency_key: string;
          monthly_due_id?: string | null;
          payment_id?: string | null;
          reference: string;
          resident_id: string;
          reverses_entry_id?: string | null;
          society_id: string;
          type: Database['public']['Enums']['LedgerEntryType'];
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          description?: string;
          direction?: Database['public']['Enums']['LedgerDirection'];
          event_date?: string;
          id?: string;
          idempotency_key?: string;
          monthly_due_id?: string | null;
          payment_id?: string | null;
          reference?: string;
          resident_id?: string;
          reverses_entry_id?: string | null;
          society_id?: string;
          type?: Database['public']['Enums']['LedgerEntryType'];
        };
        Relationships: [
          {
            foreignKeyName: 'ledger_due_fk';
            columns: ['monthly_due_id'];
            isOneToOne: false;
            referencedRelation: 'monthly_due';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ledger_payment_fk';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payment';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ledger_resident_fk';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ledger_society_fk';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_setting_period: {
        Row: {
          advance_payment_policy: Json;
          allocation_strategy: Database['public']['Enums']['AllocationStrategy'];
          archived_at: string | null;
          bank_transfer_instructions: string | null;
          created_at: string;
          created_by_user_id: string;
          currency: string;
          default_monthly_fee: number;
          due_day: number;
          effective_from: string;
          effective_to: string | null;
          grace_period_days: number;
          id: string;
          late_fee_policy: Json;
          payment_instructions: string | null;
          receipt_prefix: string;
          receipt_sequence_start: number;
          refund_and_reversal_policy: Json;
          rounding_scale: number;
          society_id: string;
          supported_payment_methods: Json;
          updated_at: string;
          version: number;
        };
        Insert: {
          advance_payment_policy: Json;
          allocation_strategy?: Database['public']['Enums']['AllocationStrategy'];
          archived_at?: string | null;
          bank_transfer_instructions?: string | null;
          created_at?: string;
          created_by_user_id: string;
          currency: string;
          default_monthly_fee: number;
          due_day: number;
          effective_from: string;
          effective_to?: string | null;
          grace_period_days?: number;
          id?: string;
          late_fee_policy: Json;
          payment_instructions?: string | null;
          receipt_prefix: string;
          receipt_sequence_start?: number;
          refund_and_reversal_policy: Json;
          rounding_scale?: number;
          society_id: string;
          supported_payment_methods: Json;
          updated_at: string;
          version?: number;
        };
        Update: {
          advance_payment_policy?: Json;
          allocation_strategy?: Database['public']['Enums']['AllocationStrategy'];
          archived_at?: string | null;
          bank_transfer_instructions?: string | null;
          created_at?: string;
          created_by_user_id?: string;
          currency?: string;
          default_monthly_fee?: number;
          due_day?: number;
          effective_from?: string;
          effective_to?: string | null;
          grace_period_days?: number;
          id?: string;
          late_fee_policy?: Json;
          payment_instructions?: string | null;
          receipt_prefix?: string;
          receipt_sequence_start?: number;
          refund_and_reversal_policy?: Json;
          rounding_scale?: number;
          society_id?: string;
          supported_payment_methods?: Json;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_setting_period_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_setting_period_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      household_member: {
        Row: {
          age: number | null;
          created_at: string;
          date_of_birth: string | null;
          emergency_contact: boolean;
          full_name: string;
          gender: Database['public']['Enums']['Gender'];
          id: string;
          identity_last_four: string | null;
          moved_out_at: string | null;
          phone: string | null;
          relationship: string;
          resident_id: string;
          status: Database['public']['Enums']['HouseholdMemberStatus'];
          updated_at: string;
          version: number;
        };
        Insert: {
          age?: number | null;
          created_at?: string;
          date_of_birth?: string | null;
          emergency_contact?: boolean;
          full_name: string;
          gender?: Database['public']['Enums']['Gender'];
          id?: string;
          identity_last_four?: string | null;
          moved_out_at?: string | null;
          phone?: string | null;
          relationship: string;
          resident_id: string;
          status?: Database['public']['Enums']['HouseholdMemberStatus'];
          updated_at?: string;
          version?: number;
        };
        Update: {
          age?: number | null;
          created_at?: string;
          date_of_birth?: string | null;
          emergency_contact?: boolean;
          full_name?: string;
          gender?: Database['public']['Enums']['Gender'];
          id?: string;
          identity_last_four?: string | null;
          moved_out_at?: string | null;
          phone?: string | null;
          relationship?: string;
          resident_id?: string;
          status?: Database['public']['Enums']['HouseholdMemberStatus'];
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'household_member_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
        ];
      };
      job_title: {
        Row: {
          active: boolean;
          created_at: string;
          department_id: string;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          normalized_name: string;
          society_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          department_id: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name: string;
          normalized_name: string;
          society_id: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          department_id?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name?: string;
          normalized_name?: string;
          society_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'job_title_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'department';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'job_title_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      late_fee_rule: {
        Row: {
          created_at: string;
          fee_plan_id: string;
          id: string;
          recurring: boolean;
          type: Database['public']['Enums']['LateFeeType'];
          updated_at: string;
          value: number;
          version: number;
        };
        Insert: {
          created_at?: string;
          fee_plan_id: string;
          id?: string;
          recurring?: boolean;
          type: Database['public']['Enums']['LateFeeType'];
          updated_at: string;
          value: number;
          version?: number;
        };
        Update: {
          created_at?: string;
          fee_plan_id?: string;
          id?: string;
          recurring?: boolean;
          type?: Database['public']['Enums']['LateFeeType'];
          updated_at?: string;
          value?: number;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'late_fee_rule_plan_fk';
            columns: ['fee_plan_id'];
            isOneToOne: true;
            referencedRelation: 'fee_plan';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_appointment: {
        Row: {
          access_instructions: string | null;
          change_reason: string | null;
          created_at: string;
          created_by_user_id: string;
          ends_at: string;
          id: string;
          maintenance_request_id: string;
          reservation_id: string | null;
          starts_at: string;
          status: Database['public']['Enums']['AppointmentStatus'];
          updated_at: string;
          version: number;
          worker_assignment_id: string;
          worker_id: string;
        };
        Insert: {
          access_instructions?: string | null;
          change_reason?: string | null;
          created_at?: string;
          created_by_user_id: string;
          ends_at: string;
          id?: string;
          maintenance_request_id: string;
          reservation_id?: string | null;
          starts_at: string;
          status?: Database['public']['Enums']['AppointmentStatus'];
          updated_at: string;
          version?: number;
          worker_assignment_id: string;
          worker_id: string;
        };
        Update: {
          access_instructions?: string | null;
          change_reason?: string | null;
          created_at?: string;
          created_by_user_id?: string;
          ends_at?: string;
          id?: string;
          maintenance_request_id?: string;
          reservation_id?: string | null;
          starts_at?: string;
          status?: Database['public']['Enums']['AppointmentStatus'];
          updated_at?: string;
          version?: number;
          worker_assignment_id?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_appointment_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_appointment_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_appointment_reservation_id_fkey';
            columns: ['reservation_id'];
            isOneToOne: false;
            referencedRelation: 'worker_schedule_reservation';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_appointment_worker_assignment_id_fkey';
            columns: ['worker_assignment_id'];
            isOneToOne: false;
            referencedRelation: 'worker_assignment';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_appointment_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_attachment: {
        Row: {
          archived_at: string | null;
          checksum_sha256: string;
          created_at: string;
          id: string;
          maintenance_request_id: string;
          media_type: string;
          message_id: string | null;
          object_key: string;
          original_file_name: string;
          sensitive: boolean;
          size_bytes: number;
          status: Database['public']['Enums']['TicketAttachmentStatus'];
          uploaded_by_user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          checksum_sha256: string;
          created_at?: string;
          id?: string;
          maintenance_request_id: string;
          media_type: string;
          message_id?: string | null;
          object_key: string;
          original_file_name: string;
          sensitive?: boolean;
          size_bytes: number;
          status?: Database['public']['Enums']['TicketAttachmentStatus'];
          uploaded_by_user_id: string;
        };
        Update: {
          archived_at?: string | null;
          checksum_sha256?: string;
          created_at?: string;
          id?: string;
          maintenance_request_id?: string;
          media_type?: string;
          message_id?: string | null;
          object_key?: string;
          original_file_name?: string;
          sensitive?: boolean;
          size_bytes?: number;
          status?: Database['public']['Enums']['TicketAttachmentStatus'];
          uploaded_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_attachment_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_attachment_uploaded_by_user_id_fkey';
            columns: ['uploaded_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_category: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          normalized_name: string;
          required_skill_id: string | null;
          society_id: string;
          updated_at: string;
          version: number;
          worker_category_id: string | null;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          normalized_name: string;
          required_skill_id?: string | null;
          society_id: string;
          updated_at: string;
          version?: number;
          worker_category_id?: string | null;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          normalized_name?: string;
          required_skill_id?: string | null;
          society_id?: string;
          updated_at?: string;
          version?: number;
          worker_category_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_category_required_skill_id_fkey';
            columns: ['required_skill_id'];
            isOneToOne: false;
            referencedRelation: 'worker_skill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_category_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_category_worker_category_id_fkey';
            columns: ['worker_category_id'];
            isOneToOne: false;
            referencedRelation: 'worker_category';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_message: {
        Row: {
          author_user_id: string;
          body: string;
          created_at: string;
          id: string;
          maintenance_request_id: string;
          visibility: Database['public']['Enums']['TicketMessageVisibility'];
        };
        Insert: {
          author_user_id: string;
          body: string;
          created_at?: string;
          id?: string;
          maintenance_request_id: string;
          visibility?: Database['public']['Enums']['TicketMessageVisibility'];
        };
        Update: {
          author_user_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          maintenance_request_id?: string;
          visibility?: Database['public']['Enums']['TicketMessageVisibility'];
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_message_author_user_id_fkey';
            columns: ['author_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_message_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_request: {
        Row: {
          access_instructions: string | null;
          archived_at: string | null;
          category_id: string;
          closed_at: string | null;
          completed_at: string | null;
          contact_disclosure_consent: boolean;
          created_at: string;
          description: string;
          exact_location: string;
          id: string;
          preferred_contact_method: string | null;
          preferred_end_minute: number | null;
          preferred_start_minute: number | null;
          preferred_visit_date: string | null;
          priority: Database['public']['Enums']['TicketPriority'];
          property_id: string | null;
          property_snapshot: Json;
          resident_id: string;
          resident_urgency: Database['public']['Enums']['TicketPriority'];
          responded_at: string | null;
          society_id: string;
          status: Database['public']['Enums']['MaintenanceStatus'];
          subject: string;
          target_resolution_at: string | null;
          target_response_at: string | null;
          ticket_number: string;
          unit_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          access_instructions?: string | null;
          archived_at?: string | null;
          category_id: string;
          closed_at?: string | null;
          completed_at?: string | null;
          contact_disclosure_consent?: boolean;
          created_at?: string;
          description: string;
          exact_location: string;
          id?: string;
          preferred_contact_method?: string | null;
          preferred_end_minute?: number | null;
          preferred_start_minute?: number | null;
          preferred_visit_date?: string | null;
          priority?: Database['public']['Enums']['TicketPriority'];
          property_id?: string | null;
          property_snapshot?: Json;
          resident_id: string;
          resident_urgency?: Database['public']['Enums']['TicketPriority'];
          responded_at?: string | null;
          society_id: string;
          status?: Database['public']['Enums']['MaintenanceStatus'];
          subject: string;
          target_resolution_at?: string | null;
          target_response_at?: string | null;
          ticket_number: string;
          unit_id?: string | null;
          updated_at: string;
          version?: number;
        };
        Update: {
          access_instructions?: string | null;
          archived_at?: string | null;
          category_id?: string;
          closed_at?: string | null;
          completed_at?: string | null;
          contact_disclosure_consent?: boolean;
          created_at?: string;
          description?: string;
          exact_location?: string;
          id?: string;
          preferred_contact_method?: string | null;
          preferred_end_minute?: number | null;
          preferred_start_minute?: number | null;
          preferred_visit_date?: string | null;
          priority?: Database['public']['Enums']['TicketPriority'];
          property_id?: string | null;
          property_snapshot?: Json;
          resident_id?: string;
          resident_urgency?: Database['public']['Enums']['TicketPriority'];
          responded_at?: string | null;
          society_id?: string;
          status?: Database['public']['Enums']['MaintenanceStatus'];
          subject?: string;
          target_resolution_at?: string | null;
          target_response_at?: string | null;
          ticket_number?: string;
          unit_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_request_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_category';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_request_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'property';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_request_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_request_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_request_unit_id_fkey';
            columns: ['unit_id'];
            isOneToOne: false;
            referencedRelation: 'unit';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_resolution: {
        Row: {
          completed_at: string;
          created_at: string;
          follow_up_recommendation: string | null;
          id: string;
          internal_notes: string | null;
          maintenance_request_id: string;
          parts_notes: string | null;
          resident_confirmed_at: string | null;
          resident_summary: string;
          updated_at: string;
          verified_by_user_id: string | null;
          version: number;
          work_performed: string;
          worker_id: string;
        };
        Insert: {
          completed_at: string;
          created_at?: string;
          follow_up_recommendation?: string | null;
          id?: string;
          internal_notes?: string | null;
          maintenance_request_id: string;
          parts_notes?: string | null;
          resident_confirmed_at?: string | null;
          resident_summary: string;
          updated_at: string;
          verified_by_user_id?: string | null;
          version?: number;
          work_performed: string;
          worker_id: string;
        };
        Update: {
          completed_at?: string;
          created_at?: string;
          follow_up_recommendation?: string | null;
          id?: string;
          internal_notes?: string | null;
          maintenance_request_id?: string;
          parts_notes?: string | null;
          resident_confirmed_at?: string | null;
          resident_summary?: string;
          updated_at?: string;
          verified_by_user_id?: string | null;
          version?: number;
          work_performed?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_resolution_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: true;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_resolution_verified_by_user_id_fkey';
            columns: ['verified_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_resolution_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_status_history: {
        Row: {
          acted_by_user_id: string;
          created_at: string;
          from_status: Database['public']['Enums']['MaintenanceStatus'] | null;
          id: string;
          internal_reason: string | null;
          maintenance_request_id: string;
          resident_explanation: string | null;
          to_status: Database['public']['Enums']['MaintenanceStatus'];
        };
        Insert: {
          acted_by_user_id: string;
          created_at?: string;
          from_status?: Database['public']['Enums']['MaintenanceStatus'] | null;
          id?: string;
          internal_reason?: string | null;
          maintenance_request_id: string;
          resident_explanation?: string | null;
          to_status: Database['public']['Enums']['MaintenanceStatus'];
        };
        Update: {
          acted_by_user_id?: string;
          created_at?: string;
          from_status?: Database['public']['Enums']['MaintenanceStatus'] | null;
          id?: string;
          internal_reason?: string | null;
          maintenance_request_id?: string;
          resident_explanation?: string | null;
          to_status?: Database['public']['Enums']['MaintenanceStatus'];
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_status_history_acted_by_user_id_fkey';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_status_history_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
        ];
      };
      monthly_due: {
        Row: {
          billing_period_id: string;
          created_at: string;
          currency: string;
          due_date: string;
          fee_plan_id: string | null;
          fee_plan_snapshot: Json;
          financial_batch_id: string | null;
          grace_ends_at: string;
          id: string;
          paid_amount: number;
          principal_amount: number;
          resident_id: string;
          society_id: string;
          status: Database['public']['Enums']['DueStatus'];
          total_amount: number;
          unit_snapshot: Json;
          updated_at: string;
          version: number;
          waived_amount: number;
        };
        Insert: {
          billing_period_id: string;
          created_at?: string;
          currency: string;
          due_date: string;
          fee_plan_id?: string | null;
          fee_plan_snapshot: Json;
          financial_batch_id?: string | null;
          grace_ends_at: string;
          id?: string;
          paid_amount?: number;
          principal_amount: number;
          resident_id: string;
          society_id: string;
          status?: Database['public']['Enums']['DueStatus'];
          total_amount: number;
          unit_snapshot: Json;
          updated_at: string;
          version?: number;
          waived_amount?: number;
        };
        Update: {
          billing_period_id?: string;
          created_at?: string;
          currency?: string;
          due_date?: string;
          fee_plan_id?: string | null;
          fee_plan_snapshot?: Json;
          financial_batch_id?: string | null;
          grace_ends_at?: string;
          id?: string;
          paid_amount?: number;
          principal_amount?: number;
          resident_id?: string;
          society_id?: string;
          status?: Database['public']['Enums']['DueStatus'];
          total_amount?: number;
          unit_snapshot?: Json;
          updated_at?: string;
          version?: number;
          waived_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_due_batch_fk';
            columns: ['financial_batch_id'];
            isOneToOne: false;
            referencedRelation: 'financial_batch';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'monthly_due_period_fk';
            columns: ['billing_period_id'];
            isOneToOne: false;
            referencedRelation: 'billing_period';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'monthly_due_plan_fk';
            columns: ['fee_plan_id'];
            isOneToOne: false;
            referencedRelation: 'fee_plan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'monthly_due_resident_fk';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'monthly_due_society_fk';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      notification: {
        Row: {
          announcement_id: string | null;
          batch_id: string | null;
          correlation_id: string | null;
          created_at: string;
          created_by_user_id: string | null;
          expires_at: string | null;
          id: string;
          idempotency_key: string;
          notification_type: string;
          priority: Database['public']['Enums']['NotificationPriority'];
          related_id: string | null;
          related_type: string | null;
          rendered_content: string;
          scheduled_at: string | null;
          society_id: string;
          status: Database['public']['Enums']['NotificationStatus'];
          subject: string | null;
          template_version_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          announcement_id?: string | null;
          batch_id?: string | null;
          correlation_id?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          expires_at?: string | null;
          id?: string;
          idempotency_key: string;
          notification_type: string;
          priority?: Database['public']['Enums']['NotificationPriority'];
          related_id?: string | null;
          related_type?: string | null;
          rendered_content: string;
          scheduled_at?: string | null;
          society_id: string;
          status?: Database['public']['Enums']['NotificationStatus'];
          subject?: string | null;
          template_version_id?: string | null;
          updated_at: string;
          version?: number;
        };
        Update: {
          announcement_id?: string | null;
          batch_id?: string | null;
          correlation_id?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          expires_at?: string | null;
          id?: string;
          idempotency_key?: string;
          notification_type?: string;
          priority?: Database['public']['Enums']['NotificationPriority'];
          related_id?: string | null;
          related_type?: string | null;
          rendered_content?: string;
          scheduled_at?: string | null;
          society_id?: string;
          status?: Database['public']['Enums']['NotificationStatus'];
          subject?: string | null;
          template_version_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_announcement_id_fkey';
            columns: ['announcement_id'];
            isOneToOne: false;
            referencedRelation: 'announcement';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_batch_id_fkey';
            columns: ['batch_id'];
            isOneToOne: false;
            referencedRelation: 'notification_batch';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_template_version_id_fkey';
            columns: ['template_version_id'];
            isOneToOne: false;
            referencedRelation: 'notification_template_version';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_batch: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          criteria: Json;
          estimated_count: number;
          failed_count: number;
          id: string;
          idempotency_key: string;
          kind: string;
          name: string;
          processed_count: number;
          recipient_snapshot: Json;
          society_id: string;
          status: Database['public']['Enums']['NotificationStatus'];
          success_count: number;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          criteria?: Json;
          estimated_count?: number;
          failed_count?: number;
          id?: string;
          idempotency_key: string;
          kind: string;
          name: string;
          processed_count?: number;
          recipient_snapshot?: Json;
          society_id: string;
          status?: Database['public']['Enums']['NotificationStatus'];
          success_count?: number;
          updated_at: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          criteria?: Json;
          estimated_count?: number;
          failed_count?: number;
          id?: string;
          idempotency_key?: string;
          kind?: string;
          name?: string;
          processed_count?: number;
          recipient_snapshot?: Json;
          society_id?: string;
          status?: Database['public']['Enums']['NotificationStatus'];
          success_count?: number;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_batch_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_delivery: {
        Row: {
          accepted_at: string | null;
          channel: Database['public']['Enums']['NotificationChannel'];
          created_at: string;
          delivered_at: string | null;
          destination_masked: string | null;
          failure_classification:
            | Database['public']['Enums']['FailureClassification']
            | null;
          failure_reason: string | null;
          id: string;
          idempotency_key: string;
          next_attempt_at: string | null;
          recipient_id: string;
          retry_count: number;
          status: Database['public']['Enums']['DeliveryStatus'];
          updated_at: string;
          version: number;
        };
        Insert: {
          accepted_at?: string | null;
          channel: Database['public']['Enums']['NotificationChannel'];
          created_at?: string;
          delivered_at?: string | null;
          destination_masked?: string | null;
          failure_classification?:
            | Database['public']['Enums']['FailureClassification']
            | null;
          failure_reason?: string | null;
          id?: string;
          idempotency_key: string;
          next_attempt_at?: string | null;
          recipient_id: string;
          retry_count?: number;
          status?: Database['public']['Enums']['DeliveryStatus'];
          updated_at: string;
          version?: number;
        };
        Update: {
          accepted_at?: string | null;
          channel?: Database['public']['Enums']['NotificationChannel'];
          created_at?: string;
          delivered_at?: string | null;
          destination_masked?: string | null;
          failure_classification?:
            | Database['public']['Enums']['FailureClassification']
            | null;
          failure_reason?: string | null;
          id?: string;
          idempotency_key?: string;
          next_attempt_at?: string | null;
          recipient_id?: string;
          retry_count?: number;
          status?: Database['public']['Enums']['DeliveryStatus'];
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_delivery_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'notification_recipient';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_job_claim: {
        Row: {
          claimed_at: string;
          completed_at: string | null;
          delivery_id: string | null;
          id: string;
          lease_expires_at: string;
          outbox_event_id: string | null;
          safe_error: string | null;
          status: Database['public']['Enums']['JobClaimStatus'];
          worker_id: string;
        };
        Insert: {
          claimed_at?: string;
          completed_at?: string | null;
          delivery_id?: string | null;
          id?: string;
          lease_expires_at: string;
          outbox_event_id?: string | null;
          safe_error?: string | null;
          status?: Database['public']['Enums']['JobClaimStatus'];
          worker_id: string;
        };
        Update: {
          claimed_at?: string;
          completed_at?: string | null;
          delivery_id?: string | null;
          id?: string;
          lease_expires_at?: string;
          outbox_event_id?: string | null;
          safe_error?: string | null;
          status?: Database['public']['Enums']['JobClaimStatus'];
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_job_claim_delivery_id_fkey';
            columns: ['delivery_id'];
            isOneToOne: false;
            referencedRelation: 'notification_delivery';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preference: {
        Row: {
          complaint_updates: boolean;
          created_at: string;
          email_enabled: boolean;
          general_announcements: boolean;
          id: string;
          in_app_enabled: boolean;
          maintenance_updates: boolean;
          optional_events: boolean;
          payment_reminders: boolean;
          preferred_language: string;
          quiet_hours_end: number | null;
          quiet_hours_start: number | null;
          sms_enabled: boolean;
          society_id: string;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          complaint_updates?: boolean;
          created_at?: string;
          email_enabled?: boolean;
          general_announcements?: boolean;
          id?: string;
          in_app_enabled?: boolean;
          maintenance_updates?: boolean;
          optional_events?: boolean;
          payment_reminders?: boolean;
          preferred_language?: string;
          quiet_hours_end?: number | null;
          quiet_hours_start?: number | null;
          sms_enabled?: boolean;
          society_id: string;
          updated_at: string;
          user_id: string;
          version?: number;
        };
        Update: {
          complaint_updates?: boolean;
          created_at?: string;
          email_enabled?: boolean;
          general_announcements?: boolean;
          id?: string;
          in_app_enabled?: boolean;
          maintenance_updates?: boolean;
          optional_events?: boolean;
          payment_reminders?: boolean;
          preferred_language?: string;
          quiet_hours_end?: number | null;
          quiet_hours_start?: number | null;
          sms_enabled?: boolean;
          society_id?: string;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preference_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_preference_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_provider_reference: {
        Row: {
          created_at: string;
          delivery_id: string;
          id: string;
          provider: string;
          provider_reference: string;
        };
        Insert: {
          created_at?: string;
          delivery_id: string;
          id?: string;
          provider: string;
          provider_reference: string;
        };
        Update: {
          created_at?: string;
          delivery_id?: string;
          id?: string;
          provider?: string;
          provider_reference?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_provider_reference_delivery_id_fkey';
            columns: ['delivery_id'];
            isOneToOne: false;
            referencedRelation: 'notification_delivery';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_recipient: {
        Row: {
          acknowledged_at: string | null;
          archived_at: string | null;
          created_at: string;
          id: string;
          notification_id: string;
          read_at: string | null;
          read_status: Database['public']['Enums']['RecipientReadStatus'];
          resident_id: string | null;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          notification_id: string;
          read_at?: string | null;
          read_status?: Database['public']['Enums']['RecipientReadStatus'];
          resident_id?: string | null;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          notification_id?: string;
          read_at?: string | null;
          read_status?: Database['public']['Enums']['RecipientReadStatus'];
          resident_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_recipient_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notification';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_recipient_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_schedule: {
        Row: {
          batch_id: string;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string;
          id: string;
          scheduled_at: string;
          time_zone: string;
          version: number;
        };
        Insert: {
          batch_id: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          scheduled_at: string;
          time_zone: string;
          version?: number;
        };
        Update: {
          batch_id?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          scheduled_at?: string;
          time_zone?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_schedule_batch_id_fkey';
            columns: ['batch_id'];
            isOneToOne: false;
            referencedRelation: 'notification_batch';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_template: {
        Row: {
          active: boolean;
          allowed_variables: Json;
          channel: Database['public']['Enums']['NotificationChannel'];
          created_at: string;
          created_by_user_id: string;
          id: string;
          language: string;
          name: string;
          notification_type: string;
          published_version: number;
          society_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          allowed_variables: Json;
          channel: Database['public']['Enums']['NotificationChannel'];
          created_at?: string;
          created_by_user_id: string;
          id?: string;
          language?: string;
          name: string;
          notification_type: string;
          published_version?: number;
          society_id: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          allowed_variables?: Json;
          channel?: Database['public']['Enums']['NotificationChannel'];
          created_at?: string;
          created_by_user_id?: string;
          id?: string;
          language?: string;
          name?: string;
          notification_type?: string;
          published_version?: number;
          society_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_template_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_template_version: {
        Row: {
          allowed_variables: Json;
          id: string;
          message_template: string;
          published_at: string;
          published_by_user_id: string;
          subject_template: string | null;
          template_id: string;
          version_number: number;
        };
        Insert: {
          allowed_variables: Json;
          id?: string;
          message_template: string;
          published_at?: string;
          published_by_user_id: string;
          subject_template?: string | null;
          template_id: string;
          version_number: number;
        };
        Update: {
          allowed_variables?: Json;
          id?: string;
          message_template?: string;
          published_at?: string;
          published_by_user_id?: string;
          subject_template?: string | null;
          template_id?: string;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_template_version_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'notification_template';
            referencedColumns: ['id'];
          },
        ];
      };
      outbox_event: {
        Row: {
          aggregate_id: string;
          aggregate_type: string;
          available_at: string;
          created_at: string;
          deduplication_key: string;
          event_type: string;
          failed_attempts: number;
          id: string;
          last_error: string | null;
          payload: Json;
          processed_at: string | null;
          status: Database['public']['Enums']['OutboxStatus'];
        };
        Insert: {
          aggregate_id: string;
          aggregate_type: string;
          available_at?: string;
          created_at?: string;
          deduplication_key: string;
          event_type: string;
          failed_attempts?: number;
          id?: string;
          last_error?: string | null;
          payload: Json;
          processed_at?: string | null;
          status?: Database['public']['Enums']['OutboxStatus'];
        };
        Update: {
          aggregate_id?: string;
          aggregate_type?: string;
          available_at?: string;
          created_at?: string;
          deduplication_key?: string;
          event_type?: string;
          failed_attempts?: number;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          processed_at?: string | null;
          status?: Database['public']['Enums']['OutboxStatus'];
        };
        Relationships: [];
      };
      password_reset_token: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          token_hash: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          token_hash: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          token_hash?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'password_reset_token_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      payment: {
        Row: {
          allocation_criteria: Json | null;
          allocation_strategy: Database['public']['Enums']['AllocationStrategy'];
          amount: number;
          confirmed_at: string | null;
          created_at: string;
          currency: string;
          id: string;
          idempotency_key: string;
          method: Database['public']['Enums']['PaymentMethod'];
          notes: string | null;
          payment_date: string;
          recorded_by_user_id: string | null;
          resident_id: string;
          reversed_at: string | null;
          society_id: string;
          status: Database['public']['Enums']['PaymentStatus'];
          transaction_reference: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          allocation_criteria?: Json | null;
          allocation_strategy: Database['public']['Enums']['AllocationStrategy'];
          amount: number;
          confirmed_at?: string | null;
          created_at?: string;
          currency: string;
          id?: string;
          idempotency_key: string;
          method: Database['public']['Enums']['PaymentMethod'];
          notes?: string | null;
          payment_date: string;
          recorded_by_user_id?: string | null;
          resident_id: string;
          reversed_at?: string | null;
          society_id: string;
          status?: Database['public']['Enums']['PaymentStatus'];
          transaction_reference?: string | null;
          updated_at: string;
          version?: number;
        };
        Update: {
          allocation_criteria?: Json | null;
          allocation_strategy?: Database['public']['Enums']['AllocationStrategy'];
          amount?: number;
          confirmed_at?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string;
          method?: Database['public']['Enums']['PaymentMethod'];
          notes?: string | null;
          payment_date?: string;
          recorded_by_user_id?: string | null;
          resident_id?: string;
          reversed_at?: string | null;
          society_id?: string;
          status?: Database['public']['Enums']['PaymentStatus'];
          transaction_reference?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_actor_fk';
            columns: ['recorded_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_resident_fk';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_society_fk';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_adjustment: {
        Row: {
          acted_by_user_id: string;
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          idempotency_key: string;
          monthly_due_id: string;
          reason: string;
          type: Database['public']['Enums']['AdjustmentType'];
        };
        Insert: {
          acted_by_user_id: string;
          amount: number;
          created_at?: string;
          currency: string;
          id?: string;
          idempotency_key: string;
          monthly_due_id: string;
          reason: string;
          type: Database['public']['Enums']['AdjustmentType'];
        };
        Update: {
          acted_by_user_id?: string;
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string;
          monthly_due_id?: string;
          reason?: string;
          type?: Database['public']['Enums']['AdjustmentType'];
        };
        Relationships: [
          {
            foreignKeyName: 'payment_adjustment_actor_fk';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_adjustment_due_fk';
            columns: ['monthly_due_id'];
            isOneToOne: false;
            referencedRelation: 'monthly_due';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_allocation: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          monthly_due_id: string;
          payment_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          monthly_due_id: string;
          payment_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          monthly_due_id?: string;
          payment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_allocation_due_fk';
            columns: ['monthly_due_id'];
            isOneToOne: false;
            referencedRelation: 'monthly_due';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_allocation_payment_fk';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payment';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_proof: {
        Row: {
          checksum_sha256: string;
          created_at: string;
          id: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          payment_id: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by_user_id: string | null;
          size_bytes: number;
        };
        Insert: {
          checksum_sha256: string;
          created_at?: string;
          id?: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          payment_id: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by_user_id?: string | null;
          size_bytes: number;
        };
        Update: {
          checksum_sha256?: string;
          created_at?: string;
          id?: string;
          media_type?: string;
          object_key?: string;
          original_file_name?: string;
          payment_id?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by_user_id?: string | null;
          size_bytes?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_proof_payment_fk';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payment';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_provider_transaction: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          idempotency_key: string;
          payment_id: string;
          provider: string;
          provider_event_id: string | null;
          provider_reference: string | null;
          safe_response: Json | null;
          status: Database['public']['Enums']['ProviderTransactionStatus'];
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency: string;
          id?: string;
          idempotency_key: string;
          payment_id: string;
          provider: string;
          provider_event_id?: string | null;
          provider_reference?: string | null;
          safe_response?: Json | null;
          status?: Database['public']['Enums']['ProviderTransactionStatus'];
          updated_at: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string;
          payment_id?: string;
          provider?: string;
          provider_event_id?: string | null;
          provider_reference?: string | null;
          safe_response?: Json | null;
          status?: Database['public']['Enums']['ProviderTransactionStatus'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'provider_transaction_payment_fk';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payment';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_reversal: {
        Row: {
          acted_by_user_id: string;
          amount: number;
          created_at: string;
          id: string;
          idempotency_key: string;
          payment_id: string;
          reason: string;
        };
        Insert: {
          acted_by_user_id: string;
          amount: number;
          created_at?: string;
          id?: string;
          idempotency_key: string;
          payment_id: string;
          reason: string;
        };
        Update: {
          acted_by_user_id?: string;
          amount?: number;
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          payment_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_reversal_actor_fk';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_reversal_payment_fk';
            columns: ['payment_id'];
            isOneToOne: true;
            referencedRelation: 'payment';
            referencedColumns: ['id'];
          },
        ];
      };
      permission: {
        Row: {
          code: string;
          created_at: string;
          description: string;
          id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          description: string;
          id?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string;
          id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      profile_correction_request: {
        Row: {
          created_at: string;
          id: string;
          reason: string;
          request_type: string;
          requested_by_user_id: string;
          requested_changes: Json;
          resident_id: string;
          resolution_note: string | null;
          resolved_at: string | null;
          resolved_by_user_id: string | null;
          society_id: string;
          status: Database['public']['Enums']['ProfileCorrectionStatus'];
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reason: string;
          request_type: string;
          requested_by_user_id: string;
          requested_changes: Json;
          resident_id: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by_user_id?: string | null;
          society_id: string;
          status?: Database['public']['Enums']['ProfileCorrectionStatus'];
          updated_at: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          reason?: string;
          request_type?: string;
          requested_by_user_id?: string;
          requested_changes?: Json;
          resident_id?: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by_user_id?: string | null;
          society_id?: string;
          status?: Database['public']['Enums']['ProfileCorrectionStatus'];
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_correction_request_requested_by_user_id_fkey';
            columns: ['requested_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profile_correction_request_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profile_correction_request_resolved_by_user_id_fkey';
            columns: ['resolved_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profile_correction_request_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      property: {
        Row: {
          active: boolean;
          archived_at: string | null;
          block: string;
          created_at: string;
          id: string;
          normalized_address_key: string;
          property_number: string;
          society_id: string;
          street: string | null;
          type: Database['public']['Enums']['PropertyType'];
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          archived_at?: string | null;
          block: string;
          created_at?: string;
          id?: string;
          normalized_address_key: string;
          property_number: string;
          society_id: string;
          street?: string | null;
          type: Database['public']['Enums']['PropertyType'];
          updated_at?: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          archived_at?: string | null;
          block?: string;
          created_at?: string;
          id?: string;
          normalized_address_key?: string;
          property_number?: string;
          society_id?: string;
          street?: string | null;
          type?: Database['public']['Enums']['PropertyType'];
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'property_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      provider_callback_event: {
        Row: {
          callback_id: string;
          delivery_id: string;
          id: string;
          payload_hash: string;
          provider: string;
          provider_reference: string;
          received_at: string;
          status: Database['public']['Enums']['DeliveryStatus'];
        };
        Insert: {
          callback_id: string;
          delivery_id: string;
          id?: string;
          payload_hash: string;
          provider: string;
          provider_reference: string;
          received_at?: string;
          status: Database['public']['Enums']['DeliveryStatus'];
        };
        Update: {
          callback_id?: string;
          delivery_id?: string;
          id?: string;
          payload_hash?: string;
          provider?: string;
          provider_reference?: string;
          received_at?: string;
          status?: Database['public']['Enums']['DeliveryStatus'];
        };
        Relationships: [
          {
            foreignKeyName: 'provider_callback_event_delivery_id_fkey';
            columns: ['delivery_id'];
            isOneToOne: false;
            referencedRelation: 'notification_delivery';
            referencedColumns: ['id'];
          },
        ];
      };
      receipt: {
        Row: {
          created_at: string;
          id: string;
          issued_at: string;
          issued_by_user_id: string;
          payment_id: string;
          pdf_object_key: string;
          receipt_number: string;
          reversed_at: string | null;
          status: Database['public']['Enums']['ReceiptStatus'];
          verification_hash: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          issued_at?: string;
          issued_by_user_id: string;
          payment_id: string;
          pdf_object_key: string;
          receipt_number: string;
          reversed_at?: string | null;
          status?: Database['public']['Enums']['ReceiptStatus'];
          verification_hash: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          issued_at?: string;
          issued_by_user_id?: string;
          payment_id?: string;
          pdf_object_key?: string;
          receipt_number?: string;
          reversed_at?: string | null;
          status?: Database['public']['Enums']['ReceiptStatus'];
          verification_hash?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'receipt_issuer_fk';
            columns: ['issued_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receipt_payment_fk';
            columns: ['payment_id'];
            isOneToOne: true;
            referencedRelation: 'payment';
            referencedColumns: ['id'];
          },
        ];
      };
      receipt_sequence: {
        Row: {
          next_value: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Insert: {
          next_value?: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Update: {
          next_value?: number;
          sequence_year?: number;
          society_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'receipt_sequence_society_fk';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      refund: {
        Row: {
          acted_by_user_id: string;
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          idempotency_key: string;
          payment_id: string;
          reason: string;
          status: Database['public']['Enums']['RefundStatus'];
        };
        Insert: {
          acted_by_user_id: string;
          amount: number;
          created_at?: string;
          currency: string;
          id?: string;
          idempotency_key: string;
          payment_id: string;
          reason: string;
          status?: Database['public']['Enums']['RefundStatus'];
        };
        Update: {
          acted_by_user_id?: string;
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string;
          payment_id?: string;
          reason?: string;
          status?: Database['public']['Enums']['RefundStatus'];
        };
        Relationships: [
          {
            foreignKeyName: 'refund_actor_fk';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refund_payment_fk';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payment';
            referencedColumns: ['id'];
          },
        ];
      };
      resident: {
        Row: {
          alternate_phone: string | null;
          archived_at: string | null;
          created_at: string;
          date_of_birth: string | null;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          full_name: string;
          gender: Database['public']['Enums']['Gender'];
          guardian_name: string | null;
          household_size: number;
          id: string;
          identity_ciphertext: string | null;
          identity_last_four: string | null;
          identity_search_hash: string | null;
          normalized_full_name: string;
          permanent_address: string | null;
          primary_phone: string;
          profile_photograph_object_key: string | null;
          resident_number: string;
          society_id: string;
          status: Database['public']['Enums']['ResidentStatus'];
          suspension_reason: string | null;
          updated_at: string;
          user_id: string | null;
          version: number;
        };
        Insert: {
          alternate_phone?: string | null;
          archived_at?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          full_name: string;
          gender?: Database['public']['Enums']['Gender'];
          guardian_name?: string | null;
          household_size?: number;
          id?: string;
          identity_ciphertext?: string | null;
          identity_last_four?: string | null;
          identity_search_hash?: string | null;
          normalized_full_name: string;
          permanent_address?: string | null;
          primary_phone: string;
          profile_photograph_object_key?: string | null;
          resident_number: string;
          society_id: string;
          status?: Database['public']['Enums']['ResidentStatus'];
          suspension_reason?: string | null;
          updated_at?: string;
          user_id?: string | null;
          version?: number;
        };
        Update: {
          alternate_phone?: string | null;
          archived_at?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          full_name?: string;
          gender?: Database['public']['Enums']['Gender'];
          guardian_name?: string | null;
          household_size?: number;
          id?: string;
          identity_ciphertext?: string | null;
          identity_last_four?: string | null;
          identity_search_hash?: string | null;
          normalized_full_name?: string;
          permanent_address?: string | null;
          primary_phone?: string;
          profile_photograph_object_key?: string | null;
          resident_number?: string;
          society_id?: string;
          status?: Database['public']['Enums']['ResidentStatus'];
          suspension_reason?: string | null;
          updated_at?: string;
          user_id?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'resident_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resident_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      resident_credit_balance: {
        Row: {
          amount: number;
          currency: string;
          resident_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          amount?: number;
          currency: string;
          resident_id: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          amount?: number;
          currency?: string;
          resident_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'resident_credit_resident_fk';
            columns: ['resident_id'];
            isOneToOne: true;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
        ];
      };
      resident_document: {
        Row: {
          archived_at: string | null;
          category: Database['public']['Enums']['ResidentDocumentCategory'];
          checksum_sha256: string;
          created_at: string;
          id: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          replaced_by_id: string | null;
          resident_id: string;
          size_bytes: number;
          status: Database['public']['Enums']['ResidentDocumentStatus'];
          updated_at: string;
          uploaded_by_user_id: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          category: Database['public']['Enums']['ResidentDocumentCategory'];
          checksum_sha256: string;
          created_at?: string;
          id?: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          replaced_by_id?: string | null;
          resident_id: string;
          size_bytes: number;
          status?: Database['public']['Enums']['ResidentDocumentStatus'];
          updated_at?: string;
          uploaded_by_user_id: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          category?: Database['public']['Enums']['ResidentDocumentCategory'];
          checksum_sha256?: string;
          created_at?: string;
          id?: string;
          media_type?: string;
          object_key?: string;
          original_file_name?: string;
          replaced_by_id?: string | null;
          resident_id?: string;
          size_bytes?: number;
          status?: Database['public']['Enums']['ResidentDocumentStatus'];
          updated_at?: string;
          uploaded_by_user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'resident_document_replaced_by_fkey';
            columns: ['replaced_by_id'];
            isOneToOne: false;
            referencedRelation: 'resident_document';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resident_document_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resident_document_uploaded_by_fkey';
            columns: ['uploaded_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      resident_fee_assignment: {
        Row: {
          assigned_by_user_id: string | null;
          created_at: string;
          currency: string;
          effective_from: string;
          effective_to: string | null;
          fee_plan_id: string | null;
          id: string;
          monthly_amount: number;
          reason: string | null;
          resident_id: string;
          security_deposit: number | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          assigned_by_user_id?: string | null;
          created_at?: string;
          currency: string;
          effective_from: string;
          effective_to?: string | null;
          fee_plan_id?: string | null;
          id?: string;
          monthly_amount: number;
          reason?: string | null;
          resident_id: string;
          security_deposit?: number | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          assigned_by_user_id?: string | null;
          created_at?: string;
          currency?: string;
          effective_from?: string;
          effective_to?: string | null;
          fee_plan_id?: string | null;
          id?: string;
          monthly_amount?: number;
          reason?: string | null;
          resident_id?: string;
          security_deposit?: number | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'resident_fee_assignment_actor_fk';
            columns: ['assigned_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resident_fee_assignment_plan_fk';
            columns: ['fee_plan_id'];
            isOneToOne: false;
            referencedRelation: 'fee_plan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resident_fee_assignment_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
        ];
      };
      resident_id_card: {
        Row: {
          card_number: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          issued_at: string;
          pdf_object_key: string;
          resident_id: string;
          revocation_reason: string | null;
          revoked_at: string | null;
          status: Database['public']['Enums']['ResidentIDCardStatus'];
          verification_hash: string;
          version: number;
        };
        Insert: {
          card_number: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          issued_at?: string;
          pdf_object_key: string;
          resident_id: string;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          status?: Database['public']['Enums']['ResidentIDCardStatus'];
          verification_hash: string;
          version?: number;
        };
        Update: {
          card_number?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          issued_at?: string;
          pdf_object_key?: string;
          resident_id?: string;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          status?: Database['public']['Enums']['ResidentIDCardStatus'];
          verification_hash?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'resident_id_card_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
        ];
      };
      resident_id_sequence: {
        Row: {
          next_value: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Insert: {
          next_value?: number;
          sequence_year: number;
          society_id: string;
          updated_at?: string;
        };
        Update: {
          next_value?: number;
          sequence_year?: number;
          society_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resident_id_sequence_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      resident_occupancy: {
        Row: {
          created_at: string;
          end_date: string | null;
          id: string;
          move_out_reason: string | null;
          occupancy_type: Database['public']['Enums']['OccupancyType'];
          primary_resident: boolean;
          property_owner_email: string | null;
          property_owner_name: string | null;
          property_owner_phone: string | null;
          resident_id: string;
          start_date: string;
          tenancy_end_date: string | null;
          tenancy_start_date: string | null;
          unit_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          move_out_reason?: string | null;
          occupancy_type: Database['public']['Enums']['OccupancyType'];
          primary_resident?: boolean;
          property_owner_email?: string | null;
          property_owner_name?: string | null;
          property_owner_phone?: string | null;
          resident_id: string;
          start_date: string;
          tenancy_end_date?: string | null;
          tenancy_start_date?: string | null;
          unit_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          move_out_reason?: string | null;
          occupancy_type?: Database['public']['Enums']['OccupancyType'];
          primary_resident?: boolean;
          property_owner_email?: string | null;
          property_owner_name?: string | null;
          property_owner_phone?: string | null;
          resident_id?: string;
          start_date?: string;
          tenancy_end_date?: string | null;
          tenancy_start_date?: string | null;
          unit_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'resident_occupancy_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resident_occupancy_unit_id_fkey';
            columns: ['unit_id'];
            isOneToOne: false;
            referencedRelation: 'unit';
            referencedColumns: ['id'];
          },
        ];
      };
      role: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          description: string | null;
          display_name: string;
          id: string;
          society_id: string;
          system_role: boolean;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          description?: string | null;
          display_name: string;
          id?: string;
          society_id: string;
          system_role?: boolean;
          updated_at?: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          description?: string | null;
          display_name?: string;
          id?: string;
          society_id?: string;
          system_role?: boolean;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'role_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      role_permission: {
        Row: {
          granted_at: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          granted_at?: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          granted_at?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'role_permission_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permission';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'role_permission_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'role';
            referencedColumns: ['id'];
          },
        ];
      };
      salary_adjustment: {
        Row: {
          acted_by_user_id: string;
          amount: number;
          created_at: string;
          id: string;
          idempotency_key: string;
          reason: string;
          salary_record_id: string;
          type: Database['public']['Enums']['SalaryAdjustmentType'];
        };
        Insert: {
          acted_by_user_id: string;
          amount: number;
          created_at?: string;
          id?: string;
          idempotency_key: string;
          reason: string;
          salary_record_id: string;
          type: Database['public']['Enums']['SalaryAdjustmentType'];
        };
        Update: {
          acted_by_user_id?: string;
          amount?: number;
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          reason?: string;
          salary_record_id?: string;
          type?: Database['public']['Enums']['SalaryAdjustmentType'];
        };
        Relationships: [
          {
            foreignKeyName: 'salary_adjustment_acted_by_user_id_fkey';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_adjustment_salary_record_id_fkey';
            columns: ['salary_record_id'];
            isOneToOne: false;
            referencedRelation: 'salary_record';
            referencedColumns: ['id'];
          },
        ];
      };
      salary_payment: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          idempotency_key: string;
          method: Database['public']['Enums']['SalaryPaymentMethod'];
          notes: string | null;
          payment_date: string;
          proof_object_key: string | null;
          recorded_by_user_id: string;
          reversed_amount: number;
          salary_record_id: string;
          status: Database['public']['Enums']['SalaryPaymentStatus'];
          transaction_reference: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency: string;
          id?: string;
          idempotency_key: string;
          method: Database['public']['Enums']['SalaryPaymentMethod'];
          notes?: string | null;
          payment_date: string;
          proof_object_key?: string | null;
          recorded_by_user_id: string;
          reversed_amount?: number;
          salary_record_id: string;
          status?: Database['public']['Enums']['SalaryPaymentStatus'];
          transaction_reference?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string;
          method?: Database['public']['Enums']['SalaryPaymentMethod'];
          notes?: string | null;
          payment_date?: string;
          proof_object_key?: string | null;
          recorded_by_user_id?: string;
          reversed_amount?: number;
          salary_record_id?: string;
          status?: Database['public']['Enums']['SalaryPaymentStatus'];
          transaction_reference?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'salary_payment_recorded_by_user_id_fkey';
            columns: ['recorded_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_payment_salary_record_id_fkey';
            columns: ['salary_record_id'];
            isOneToOne: false;
            referencedRelation: 'salary_record';
            referencedColumns: ['id'];
          },
        ];
      };
      salary_period: {
        Row: {
          created_at: string;
          ends_at: string;
          id: string;
          month: number;
          society_id: string;
          starts_at: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          month: number;
          society_id: string;
          starts_at: string;
          year: number;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          month?: number;
          society_id?: string;
          starts_at?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'salary_period_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      salary_record: {
        Row: {
          adjustment_total: number;
          allowances: number;
          amount_paid: number;
          basic_salary: number;
          currency: string;
          deductions: number;
          generated_at: string;
          generated_by_user_id: string;
          id: string;
          net_payable: number;
          notes: string | null;
          paid_at: string | null;
          salary_period_id: string;
          salary_snapshot: Json;
          salary_structure_id: string;
          staff_id: string;
          status: Database['public']['Enums']['SalaryRecordStatus'];
          updated_at: string;
          version: number;
        };
        Insert: {
          adjustment_total?: number;
          allowances?: number;
          amount_paid?: number;
          basic_salary: number;
          currency: string;
          deductions?: number;
          generated_at?: string;
          generated_by_user_id: string;
          id?: string;
          net_payable: number;
          notes?: string | null;
          paid_at?: string | null;
          salary_period_id: string;
          salary_snapshot: Json;
          salary_structure_id: string;
          staff_id: string;
          status?: Database['public']['Enums']['SalaryRecordStatus'];
          updated_at: string;
          version?: number;
        };
        Update: {
          adjustment_total?: number;
          allowances?: number;
          amount_paid?: number;
          basic_salary?: number;
          currency?: string;
          deductions?: number;
          generated_at?: string;
          generated_by_user_id?: string;
          id?: string;
          net_payable?: number;
          notes?: string | null;
          paid_at?: string | null;
          salary_period_id?: string;
          salary_snapshot?: Json;
          salary_structure_id?: string;
          staff_id?: string;
          status?: Database['public']['Enums']['SalaryRecordStatus'];
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'salary_record_generated_by_user_id_fkey';
            columns: ['generated_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_record_salary_period_id_fkey';
            columns: ['salary_period_id'];
            isOneToOne: false;
            referencedRelation: 'salary_period';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_record_salary_structure_id_fkey';
            columns: ['salary_structure_id'];
            isOneToOne: false;
            referencedRelation: 'salary_structure';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_record_staff_id_fkey';
            columns: ['staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff_member';
            referencedColumns: ['id'];
          },
        ];
      };
      salary_slip: {
        Row: {
          created_at: string;
          id: string;
          issued_at: string;
          issued_by_user_id: string;
          pdf_object_key: string;
          reversed_at: string | null;
          salary_record_id: string;
          slip_number: string;
          status: Database['public']['Enums']['SalarySlipStatus'];
          verification_hash: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          issued_at?: string;
          issued_by_user_id: string;
          pdf_object_key: string;
          reversed_at?: string | null;
          salary_record_id: string;
          slip_number: string;
          status?: Database['public']['Enums']['SalarySlipStatus'];
          verification_hash: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          issued_at?: string;
          issued_by_user_id?: string;
          pdf_object_key?: string;
          reversed_at?: string | null;
          salary_record_id?: string;
          slip_number?: string;
          status?: Database['public']['Enums']['SalarySlipStatus'];
          verification_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'salary_slip_issued_by_user_id_fkey';
            columns: ['issued_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_slip_salary_record_id_fkey';
            columns: ['salary_record_id'];
            isOneToOne: false;
            referencedRelation: 'salary_record';
            referencedColumns: ['id'];
          },
        ];
      };
      salary_slip_sequence: {
        Row: {
          next_value: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Insert: {
          next_value?: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Update: {
          next_value?: number;
          sequence_year?: number;
          society_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'salary_slip_sequence_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      salary_structure: {
        Row: {
          basic_salary: number;
          created_at: string;
          created_by_user_id: string;
          currency: string;
          effective_from: string;
          effective_to: string | null;
          fixed_allowances: number;
          fixed_deductions: number;
          frequency: Database['public']['Enums']['SalaryFrequency'];
          id: string;
          notes: string | null;
          staff_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          basic_salary: number;
          created_at?: string;
          created_by_user_id: string;
          currency: string;
          effective_from: string;
          effective_to?: string | null;
          fixed_allowances?: number;
          fixed_deductions?: number;
          frequency?: Database['public']['Enums']['SalaryFrequency'];
          id?: string;
          notes?: string | null;
          staff_id: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          basic_salary?: number;
          created_at?: string;
          created_by_user_id?: string;
          currency?: string;
          effective_from?: string;
          effective_to?: string | null;
          fixed_allowances?: number;
          fixed_deductions?: number;
          frequency?: Database['public']['Enums']['SalaryFrequency'];
          id?: string;
          notes?: string | null;
          staff_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'salary_structure_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'salary_structure_staff_id_fkey';
            columns: ['staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff_member';
            referencedColumns: ['id'];
          },
        ];
      };
      service_level_policy: {
        Row: {
          active: boolean;
          category_id: string | null;
          created_at: string;
          escalation_role_code: string;
          id: string;
          priority: Database['public']['Enums']['TicketPriority'];
          resolution_minutes: number;
          response_minutes: number;
          society_id: string;
          ticket_type: Database['public']['Enums']['TicketType'];
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          category_id?: string | null;
          created_at?: string;
          escalation_role_code: string;
          id?: string;
          priority: Database['public']['Enums']['TicketPriority'];
          resolution_minutes: number;
          response_minutes: number;
          society_id: string;
          ticket_type: Database['public']['Enums']['TicketType'];
          updated_at: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          category_id?: string | null;
          created_at?: string;
          escalation_role_code?: string;
          id?: string;
          priority?: Database['public']['Enums']['TicketPriority'];
          resolution_minutes?: number;
          response_minutes?: number;
          society_id?: string;
          ticket_type?: Database['public']['Enums']['TicketType'];
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'service_level_policy_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      service_rating: {
        Row: {
          comments: string | null;
          confidential_comments: string | null;
          created_at: string;
          id: string;
          maintenance_request_id: string;
          overall: number;
          professional_behaviour: number;
          resident_id: string;
          service_quality: number;
          timeliness: number;
          updated_at: string;
          version: number;
          worker_id: string;
        };
        Insert: {
          comments?: string | null;
          confidential_comments?: string | null;
          created_at?: string;
          id?: string;
          maintenance_request_id: string;
          overall: number;
          professional_behaviour: number;
          resident_id: string;
          service_quality: number;
          timeliness: number;
          updated_at: string;
          version?: number;
          worker_id: string;
        };
        Update: {
          comments?: string | null;
          confidential_comments?: string | null;
          created_at?: string;
          id?: string;
          maintenance_request_id?: string;
          overall?: number;
          professional_behaviour?: number;
          resident_id?: string;
          service_quality?: number;
          timeliness?: number;
          updated_at?: string;
          version?: number;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_rating_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: true;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_rating_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_rating_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      service_worker: {
        Row: {
          address: string | null;
          administrative_notes: string | null;
          alternate_phone: string | null;
          archived_at: string | null;
          contractor_company_id: string | null;
          created_at: string;
          date_of_birth: string | null;
          email: string | null;
          emergency_contact: string | null;
          experience_years: number;
          full_name: string;
          id: string;
          identity_ciphertext: string | null;
          identity_last_four: string | null;
          identity_search_hash: string | null;
          normalized_full_name: string;
          primary_category_id: string;
          primary_phone: string;
          rate_notes: string | null;
          registration_date: string;
          relationship: Database['public']['Enums']['WorkerRelationship'];
          service_area: string;
          society_id: string;
          status: Database['public']['Enums']['WorkerStatus'];
          updated_at: string;
          user_id: string | null;
          version: number;
          worker_number: string;
        };
        Insert: {
          address?: string | null;
          administrative_notes?: string | null;
          alternate_phone?: string | null;
          archived_at?: string | null;
          contractor_company_id?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          experience_years?: number;
          full_name: string;
          id?: string;
          identity_ciphertext?: string | null;
          identity_last_four?: string | null;
          identity_search_hash?: string | null;
          normalized_full_name: string;
          primary_category_id: string;
          primary_phone: string;
          rate_notes?: string | null;
          registration_date: string;
          relationship: Database['public']['Enums']['WorkerRelationship'];
          service_area: string;
          society_id: string;
          status?: Database['public']['Enums']['WorkerStatus'];
          updated_at: string;
          user_id?: string | null;
          version?: number;
          worker_number: string;
        };
        Update: {
          address?: string | null;
          administrative_notes?: string | null;
          alternate_phone?: string | null;
          archived_at?: string | null;
          contractor_company_id?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          experience_years?: number;
          full_name?: string;
          id?: string;
          identity_ciphertext?: string | null;
          identity_last_four?: string | null;
          identity_search_hash?: string | null;
          normalized_full_name?: string;
          primary_category_id?: string;
          primary_phone?: string;
          rate_notes?: string | null;
          registration_date?: string;
          relationship?: Database['public']['Enums']['WorkerRelationship'];
          service_area?: string;
          society_id?: string;
          status?: Database['public']['Enums']['WorkerStatus'];
          updated_at?: string;
          user_id?: string | null;
          version?: number;
          worker_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_worker_contractor_company_id_fkey';
            columns: ['contractor_company_id'];
            isOneToOne: false;
            referencedRelation: 'contractor_company';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_worker_primary_category_id_fkey';
            columns: ['primary_category_id'];
            isOneToOne: false;
            referencedRelation: 'worker_category';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_worker_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_worker_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      society: {
        Row: {
          archived_at: string | null;
          created_at: string;
          currency: string;
          id: string;
          name: string;
          slug: string;
          status: Database['public']['Enums']['SocietyStatus'];
          time_zone: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          name: string;
          slug: string;
          status?: Database['public']['Enums']['SocietyStatus'];
          time_zone?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
          slug?: string;
          status?: Database['public']['Enums']['SocietyStatus'];
          time_zone?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      staff_document: {
        Row: {
          archived_at: string | null;
          category: string;
          checksum_sha256: string;
          created_at: string;
          id: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          size_bytes: number;
          staff_id: string;
          status: Database['public']['Enums']['WorkforceDocumentStatus'];
          uploaded_by_user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          category: string;
          checksum_sha256: string;
          created_at?: string;
          id?: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          size_bytes: number;
          staff_id: string;
          status?: Database['public']['Enums']['WorkforceDocumentStatus'];
          uploaded_by_user_id: string;
        };
        Update: {
          archived_at?: string | null;
          category?: string;
          checksum_sha256?: string;
          created_at?: string;
          id?: string;
          media_type?: string;
          object_key?: string;
          original_file_name?: string;
          size_bytes?: number;
          staff_id?: string;
          status?: Database['public']['Enums']['WorkforceDocumentStatus'];
          uploaded_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_document_staff_id_fkey';
            columns: ['staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff_member';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_document_uploaded_by_user_id_fkey';
            columns: ['uploaded_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_id_sequence: {
        Row: {
          next_value: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Insert: {
          next_value?: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Update: {
          next_value?: number;
          sequence_year?: number;
          society_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_id_sequence_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_member: {
        Row: {
          address: string | null;
          alternate_phone: string | null;
          archived_at: string | null;
          created_at: string;
          date_of_birth: string | null;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          full_name: string;
          gender: Database['public']['Enums']['Gender'];
          guardian_name: string | null;
          id: string;
          identity_ciphertext: string | null;
          identity_last_four: string | null;
          identity_search_hash: string | null;
          normalized_full_name: string;
          primary_phone: string;
          society_id: string;
          staff_number: string;
          status: Database['public']['Enums']['StaffStatus'];
          updated_at: string;
          user_id: string | null;
          version: number;
        };
        Insert: {
          address?: string | null;
          alternate_phone?: string | null;
          archived_at?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          full_name: string;
          gender?: Database['public']['Enums']['Gender'];
          guardian_name?: string | null;
          id?: string;
          identity_ciphertext?: string | null;
          identity_last_four?: string | null;
          identity_search_hash?: string | null;
          normalized_full_name: string;
          primary_phone: string;
          society_id: string;
          staff_number: string;
          status?: Database['public']['Enums']['StaffStatus'];
          updated_at: string;
          user_id?: string | null;
          version?: number;
        };
        Update: {
          address?: string | null;
          alternate_phone?: string | null;
          archived_at?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          full_name?: string;
          gender?: Database['public']['Enums']['Gender'];
          guardian_name?: string | null;
          id?: string;
          identity_ciphertext?: string | null;
          identity_last_four?: string | null;
          identity_search_hash?: string | null;
          normalized_full_name?: string;
          primary_phone?: string;
          society_id?: string;
          staff_number?: string;
          status?: Database['public']['Enums']['StaffStatus'];
          updated_at?: string;
          user_id?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_member_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_member_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_status_history: {
        Row: {
          acted_by_user_id: string;
          created_at: string;
          effective_at: string;
          from_status: Database['public']['Enums']['StaffStatus'] | null;
          id: string;
          reason: string;
          staff_id: string;
          to_status: Database['public']['Enums']['StaffStatus'];
        };
        Insert: {
          acted_by_user_id: string;
          created_at?: string;
          effective_at: string;
          from_status?: Database['public']['Enums']['StaffStatus'] | null;
          id?: string;
          reason: string;
          staff_id: string;
          to_status: Database['public']['Enums']['StaffStatus'];
        };
        Update: {
          acted_by_user_id?: string;
          created_at?: string;
          effective_at?: string;
          from_status?: Database['public']['Enums']['StaffStatus'] | null;
          id?: string;
          reason?: string;
          staff_id?: string;
          to_status?: Database['public']['Enums']['StaffStatus'];
        };
        Relationships: [
          {
            foreignKeyName: 'staff_status_history_acted_by_user_id_fkey';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_status_history_staff_id_fkey';
            columns: ['staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff_member';
            referencedColumns: ['id'];
          },
        ];
      };
      system_setting: {
        Row: {
          archived_at: string | null;
          created_at: string;
          effective_from: string;
          id: string;
          secret_reference: string | null;
          setting_key: string;
          setting_value: string | null;
          society_id: string | null;
          updated_at: string;
          value_type: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          effective_from?: string;
          id?: string;
          secret_reference?: string | null;
          setting_key: string;
          setting_value?: string | null;
          society_id?: string | null;
          updated_at?: string;
          value_type: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          effective_from?: string;
          id?: string;
          secret_reference?: string | null;
          setting_key?: string;
          setting_value?: string | null;
          society_id?: string | null;
          updated_at?: string;
          value_type?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'system_setting_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      ticket_sequence: {
        Row: {
          next_value: number;
          sequence_year: number;
          society_id: string;
          ticket_type: Database['public']['Enums']['TicketType'];
          updated_at: string;
        };
        Insert: {
          next_value?: number;
          sequence_year: number;
          society_id: string;
          ticket_type: Database['public']['Enums']['TicketType'];
          updated_at: string;
        };
        Update: {
          next_value?: number;
          sequence_year?: number;
          society_id?: string;
          ticket_type?: Database['public']['Enums']['TicketType'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ticket_sequence_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      unit: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          normalized_unit_number: string;
          parking_information: string | null;
          property_id: string;
          status: Database['public']['Enums']['UnitStatus'];
          unit_number: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          normalized_unit_number: string;
          parking_information?: string | null;
          property_id: string;
          status?: Database['public']['Enums']['UnitStatus'];
          unit_number: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          normalized_unit_number?: string;
          parking_information?: string | null;
          property_id?: string;
          status?: Database['public']['Enums']['UnitStatus'];
          unit_number?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'unit_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'property';
            referencedColumns: ['id'];
          },
        ];
      };
      user_account: {
        Row: {
          archived_at: string | null;
          created_at: string;
          display_name: string;
          email: string | null;
          email_verified: boolean;
          failed_login_count: number;
          force_password_change: boolean;
          id: string;
          last_login_at: string | null;
          locked_until: string | null;
          normalized_email: string | null;
          normalized_username: string;
          password_changed_at: string | null;
          password_hash: string;
          society_id: string;
          status: Database['public']['Enums']['AccountStatus'];
          updated_at: string;
          username: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          display_name: string;
          email?: string | null;
          email_verified?: boolean;
          failed_login_count?: number;
          force_password_change?: boolean;
          id?: string;
          last_login_at?: string | null;
          locked_until?: string | null;
          normalized_email?: string | null;
          normalized_username: string;
          password_changed_at?: string | null;
          password_hash: string;
          society_id: string;
          status?: Database['public']['Enums']['AccountStatus'];
          updated_at?: string;
          username: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string | null;
          email_verified?: boolean;
          failed_login_count?: number;
          force_password_change?: boolean;
          id?: string;
          last_login_at?: string | null;
          locked_until?: string | null;
          normalized_email?: string | null;
          normalized_username?: string;
          password_changed_at?: string | null;
          password_hash?: string;
          society_id?: string;
          status?: Database['public']['Enums']['AccountStatus'];
          updated_at?: string;
          username?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_account_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      user_role: {
        Row: {
          assigned_at: string;
          role_id: string;
          society_id: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          role_id: string;
          society_id: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          role_id?: string;
          society_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_role_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'role';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_role_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_role_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      user_session: {
        Row: {
          created_at: string;
          csrf_token_hash: string;
          expires_at: string;
          id: string;
          issued_at: string;
          last_seen_at: string;
          revoked_at: string | null;
          revoked_reason: string | null;
          society_id: string;
          source_ip: string | null;
          token_hash: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          csrf_token_hash: string;
          expires_at: string;
          id?: string;
          issued_at?: string;
          last_seen_at?: string;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          society_id: string;
          source_ip?: string | null;
          token_hash: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          csrf_token_hash?: string;
          expires_at?: string;
          id?: string;
          issued_at?: string;
          last_seen_at?: string;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          society_id?: string;
          source_ip?: string | null;
          token_hash?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_session_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_session_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
        ];
      };
      vehicle: {
        Row: {
          active: boolean;
          colour: string | null;
          created_at: string;
          deactivated_at: string | null;
          id: string;
          manufacturer: string | null;
          model: string | null;
          name: string | null;
          normalized_registration_number: string;
          parking_location: string | null;
          parking_permit_number: string | null;
          registration_number: string;
          resident_id: string;
          society_id: string;
          type: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          colour?: string | null;
          created_at?: string;
          deactivated_at?: string | null;
          id?: string;
          manufacturer?: string | null;
          model?: string | null;
          name?: string | null;
          normalized_registration_number: string;
          parking_location?: string | null;
          parking_permit_number?: string | null;
          registration_number: string;
          resident_id: string;
          society_id: string;
          type: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          colour?: string | null;
          created_at?: string;
          deactivated_at?: string | null;
          id?: string;
          manufacturer?: string | null;
          model?: string | null;
          name?: string | null;
          normalized_registration_number?: string;
          parking_location?: string | null;
          parking_permit_number?: string | null;
          registration_number?: string;
          resident_id?: string;
          society_id?: string;
          type?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicle_resident_id_fkey';
            columns: ['resident_id'];
            isOneToOne: false;
            referencedRelation: 'resident';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicle_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_assignment: {
        Row: {
          assigned_at: string;
          assigned_by_user_id: string;
          ended_at: string | null;
          id: string;
          maintenance_request_id: string;
          reason: string;
          status: Database['public']['Enums']['WorkerAssignmentStatus'];
          version: number;
          worker_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by_user_id: string;
          ended_at?: string | null;
          id?: string;
          maintenance_request_id: string;
          reason: string;
          status?: Database['public']['Enums']['WorkerAssignmentStatus'];
          version?: number;
          worker_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by_user_id?: string;
          ended_at?: string | null;
          id?: string;
          maintenance_request_id?: string;
          reason?: string;
          status?: Database['public']['Enums']['WorkerAssignmentStatus'];
          version?: number;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_assignment_assigned_by_user_id_fkey';
            columns: ['assigned_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worker_assignment_maintenance_request_id_fkey';
            columns: ['maintenance_request_id'];
            isOneToOne: false;
            referencedRelation: 'maintenance_request';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worker_assignment_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_availability: {
        Row: {
          active: boolean;
          created_at: string;
          day_of_week: number;
          end_minute: number;
          id: string;
          service_area: string | null;
          start_minute: number;
          updated_at: string;
          version: number;
          worker_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          day_of_week: number;
          end_minute: number;
          id?: string;
          service_area?: string | null;
          start_minute: number;
          updated_at: string;
          version?: number;
          worker_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          day_of_week?: number;
          end_minute?: number;
          id?: string;
          service_area?: string | null;
          start_minute?: number;
          updated_at?: string;
          version?: number;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_availability_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_availability_override: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          ends_at: string;
          id: string;
          reason: string;
          starts_at: string;
          type: Database['public']['Enums']['AvailabilityOverrideType'];
          worker_id: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          ends_at: string;
          id?: string;
          reason: string;
          starts_at: string;
          type: Database['public']['Enums']['AvailabilityOverrideType'];
          worker_id: string;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          ends_at?: string;
          id?: string;
          reason?: string;
          starts_at?: string;
          type?: Database['public']['Enums']['AvailabilityOverrideType'];
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_availability_override_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worker_availability_override_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_category: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          currency: string | null;
          default_duration_minutes: number | null;
          default_rate: number | null;
          description: string | null;
          id: string;
          name: string;
          society_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          currency?: string | null;
          default_duration_minutes?: number | null;
          default_rate?: number | null;
          description?: string | null;
          id?: string;
          name: string;
          society_id: string;
          updated_at: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          currency?: string | null;
          default_duration_minutes?: number | null;
          default_rate?: number | null;
          description?: string | null;
          id?: string;
          name?: string;
          society_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_category_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_document: {
        Row: {
          archived_at: string | null;
          category: string;
          checksum_sha256: string;
          created_at: string;
          id: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          size_bytes: number;
          status: Database['public']['Enums']['WorkforceDocumentStatus'];
          uploaded_by_user_id: string;
          worker_id: string;
        };
        Insert: {
          archived_at?: string | null;
          category: string;
          checksum_sha256: string;
          created_at?: string;
          id?: string;
          media_type: string;
          object_key: string;
          original_file_name: string;
          size_bytes: number;
          status?: Database['public']['Enums']['WorkforceDocumentStatus'];
          uploaded_by_user_id: string;
          worker_id: string;
        };
        Update: {
          archived_at?: string | null;
          category?: string;
          checksum_sha256?: string;
          created_at?: string;
          id?: string;
          media_type?: string;
          object_key?: string;
          original_file_name?: string;
          size_bytes?: number;
          status?: Database['public']['Enums']['WorkforceDocumentStatus'];
          uploaded_by_user_id?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_document_uploaded_by_user_id_fkey';
            columns: ['uploaded_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worker_document_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_id_sequence: {
        Row: {
          category_code: string;
          next_value: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Insert: {
          category_code: string;
          next_value?: number;
          sequence_year: number;
          society_id: string;
          updated_at: string;
        };
        Update: {
          category_code?: string;
          next_value?: number;
          sequence_year?: number;
          society_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_id_sequence_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_performance_note: {
        Row: {
          created_at: string;
          id: string;
          note: string;
          reliability: number | null;
          review_date: string;
          reviewed_by_user_id: string;
          work_quality: number | null;
          worker_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          note: string;
          reliability?: number | null;
          review_date: string;
          reviewed_by_user_id: string;
          work_quality?: number | null;
          worker_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          note?: string;
          reliability?: number | null;
          review_date?: string;
          reviewed_by_user_id?: string;
          work_quality?: number | null;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_performance_note_reviewed_by_user_id_fkey';
            columns: ['reviewed_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worker_performance_note_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_rate: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          effective_from: string;
          effective_to: string | null;
          id: string;
          notes: string | null;
          unit: string;
          worker_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency: string;
          effective_from: string;
          effective_to?: string | null;
          id?: string;
          notes?: string | null;
          unit: string;
          worker_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          notes?: string | null;
          unit?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_rate_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_schedule_reservation: {
        Row: {
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string;
          created_by_user_id: string;
          ends_at: string;
          id: string;
          purpose: string;
          service_area: string | null;
          starts_at: string;
          status: Database['public']['Enums']['ScheduleReservationStatus'];
          updated_at: string;
          version: number;
          worker_id: string;
        };
        Insert: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          created_by_user_id: string;
          ends_at: string;
          id?: string;
          purpose: string;
          service_area?: string | null;
          starts_at: string;
          status?: Database['public']['Enums']['ScheduleReservationStatus'];
          updated_at: string;
          version?: number;
          worker_id: string;
        };
        Update: {
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          created_by_user_id?: string;
          ends_at?: string;
          id?: string;
          purpose?: string;
          service_area?: string | null;
          starts_at?: string;
          status?: Database['public']['Enums']['ScheduleReservationStatus'];
          updated_at?: string;
          version?: number;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_schedule_reservation_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worker_schedule_reservation_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_skill: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          normalized_name: string;
          society_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          normalized_name: string;
          society_id: string;
          updated_at: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          normalized_name?: string;
          society_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_skill_society_id_fkey';
            columns: ['society_id'];
            isOneToOne: false;
            referencedRelation: 'society';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_skill_assignment: {
        Row: {
          assigned_at: string;
          proficiency: string | null;
          skill_id: string;
          worker_id: string;
        };
        Insert: {
          assigned_at?: string;
          proficiency?: string | null;
          skill_id: string;
          worker_id: string;
        };
        Update: {
          assigned_at?: string;
          proficiency?: string | null;
          skill_id?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_skill_assignment_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'worker_skill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worker_skill_assignment_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
      worker_status_history: {
        Row: {
          acted_by_user_id: string;
          created_at: string;
          effective_at: string;
          from_status: Database['public']['Enums']['WorkerStatus'] | null;
          id: string;
          reason: string;
          to_status: Database['public']['Enums']['WorkerStatus'];
          worker_id: string;
        };
        Insert: {
          acted_by_user_id: string;
          created_at?: string;
          effective_at: string;
          from_status?: Database['public']['Enums']['WorkerStatus'] | null;
          id?: string;
          reason: string;
          to_status: Database['public']['Enums']['WorkerStatus'];
          worker_id: string;
        };
        Update: {
          acted_by_user_id?: string;
          created_at?: string;
          effective_at?: string;
          from_status?: Database['public']['Enums']['WorkerStatus'] | null;
          id?: string;
          reason?: string;
          to_status?: Database['public']['Enums']['WorkerStatus'];
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worker_status_history_acted_by_user_id_fkey';
            columns: ['acted_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'user_account';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worker_status_history_worker_id_fkey';
            columns: ['worker_id'];
            isOneToOne: false;
            referencedRelation: 'service_worker';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      AccountStatus:
        | 'INVITED'
        | 'ACTIVE'
        | 'SUSPENDED'
        | 'DEACTIVATED'
        | 'ARCHIVED';
      AdjustmentType:
        | 'FIXED_DISCOUNT'
        | 'PERCENTAGE_DISCOUNT'
        | 'PARTIAL_WAIVER'
        | 'FULL_WAIVER'
        | 'DEBIT_ADJUSTMENT'
        | 'CREDIT_ADJUSTMENT'
        | 'CORRECTION';
      AllocationStrategy:
        | 'OLDEST_DUE_FIRST'
        | 'SELECTED_DUES'
        | 'CURRENT_MONTH'
        | 'ALL_OUTSTANDING'
        | 'ADVANCE';
      AnnouncementStatus:
        | 'DRAFT'
        | 'SCHEDULED'
        | 'PUBLISHED'
        | 'EXPIRED'
        | 'CANCELLED';
      AppointmentStatus:
        | 'PROPOSED'
        | 'CONFIRMED'
        | 'RESCHEDULED'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELLED'
        | 'MISSED';
      AudienceType:
        | 'ALL_RESIDENTS'
        | 'SELECTED_RESIDENTS'
        | 'SELECTED_BLOCKS'
        | 'SELECTED_UNITS'
        | 'OWNERS'
        | 'TENANTS'
        | 'STAFF'
        | 'WORKERS'
        | 'ADMINISTRATORS'
        | 'CUSTOM';
      AuditOutcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
      AvailabilityOverrideType: 'AVAILABLE' | 'UNAVAILABLE' | 'LEAVE';
      ComplaintPrivacy: 'STANDARD' | 'RESTRICTED' | 'CONFIDENTIAL';
      ComplaintStatus:
        | 'SUBMITTED'
        | 'UNDER_REVIEW'
        | 'ASSIGNED'
        | 'IN_PROGRESS'
        | 'WAITING_FOR_RESIDENT'
        | 'RESOLVED'
        | 'REJECTED'
        | 'CLOSED'
        | 'REOPENED';
      DeliveryStatus:
        | 'QUEUED'
        | 'PROCESSING'
        | 'ACCEPTED'
        | 'DELIVERED'
        | 'FAILED'
        | 'RETRYING'
        | 'SKIPPED'
        | 'CANCELLED'
        | 'EXPIRED';
      DueLineItemType:
        | 'PRINCIPAL'
        | 'LATE_FEE'
        | 'DEBIT_ADJUSTMENT'
        | 'DISCOUNT'
        | 'WAIVER';
      DueStatus:
        | 'UPCOMING'
        | 'PENDING'
        | 'PARTIALLY_PAID'
        | 'PAID'
        | 'OVERDUE'
        | 'WAIVED'
        | 'CANCELLED'
        | 'UNDER_REVIEW';
      EmploymentType:
        | 'PERMANENT'
        | 'CONTRACT'
        | 'PART_TIME'
        | 'TEMPORARY'
        | 'DAILY_WAGE'
        | 'OTHER';
      EscalationKind:
        | 'RESPONSE_DUE'
        | 'RESPONSE_OVERDUE'
        | 'RESOLUTION_DUE'
        | 'RESOLUTION_OVERDUE';
      FailureClassification:
        | 'TEMPORARY'
        | 'PERMANENT'
        | 'INVALID_RECIPIENT'
        | 'PROVIDER_DISABLED'
        | 'UNKNOWN';
      FeePlanScope: 'SOCIETY_DEFAULT' | 'PROPERTY_TYPE' | 'UNIT';
      FinancialBatchStatus:
        | 'PREVIEWED'
        | 'PROCESSING'
        | 'COMPLETED'
        | 'PARTIALLY_COMPLETED'
        | 'FAILED';
      Gender: 'FEMALE' | 'MALE' | 'OTHER' | 'UNDISCLOSED';
      HouseholdMemberStatus: 'ACTIVE' | 'MOVED_OUT' | 'INACTIVE';
      JobClaimStatus: 'CLAIMED' | 'COMPLETED' | 'FAILED';
      LateFeeType: 'NONE' | 'FIXED' | 'PERCENTAGE';
      LedgerDirection: 'DEBIT' | 'CREDIT';
      LedgerEntryType:
        | 'OPENING_BALANCE'
        | 'MONTHLY_DUE'
        | 'LATE_FEE'
        | 'PAYMENT'
        | 'DISCOUNT'
        | 'WAIVER'
        | 'DEBIT_ADJUSTMENT'
        | 'CREDIT_ADJUSTMENT'
        | 'REVERSAL'
        | 'REFUND'
        | 'ADVANCE_CREDIT'
        | 'ADVANCE_APPLIED';
      MaintenanceStatus:
        | 'SUBMITTED'
        | 'UNDER_REVIEW'
        | 'APPROVED'
        | 'ASSIGNED'
        | 'VISIT_SCHEDULED'
        | 'WORK_IN_PROGRESS'
        | 'AWAITING_PARTS'
        | 'WAITING_FOR_RESIDENT'
        | 'COMPLETED'
        | 'CANCELLED'
        | 'REJECTED'
        | 'REOPENED'
        | 'CLOSED';
      NotificationChannel: 'IN_APP' | 'EMAIL' | 'SMS';
      NotificationPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
      NotificationStatus:
        | 'DRAFT'
        | 'SCHEDULED'
        | 'PROCESSING'
        | 'PARTIALLY_SENT'
        | 'SENT'
        | 'FAILED'
        | 'CANCELLED'
        | 'EXPIRED';
      OccupancyType: 'OWNER' | 'TENANT';
      OutboxStatus: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
      PaymentMethod:
        | 'CASH'
        | 'BANK_TRANSFER'
        | 'CARD_PROVIDER'
        | 'DIGITAL_WALLET'
        | 'CHEQUE'
        | 'OTHER';
      PaymentStatus:
        | 'INITIATED'
        | 'PENDING_VERIFICATION'
        | 'CONFIRMED'
        | 'FAILED'
        | 'CANCELLED'
        | 'REVERSED'
        | 'PARTIALLY_REFUNDED'
        | 'REFUNDED';
      ProfileCorrectionStatus:
        | 'PENDING'
        | 'APPROVED'
        | 'REJECTED'
        | 'CANCELLED';
      PropertyType: 'HOUSE' | 'APARTMENT' | 'PLOT' | 'COMMERCIAL' | 'OTHER';
      ProviderTransactionStatus:
        | 'CREATED'
        | 'PENDING'
        | 'CONFIRMED'
        | 'FAILED'
        | 'CANCELLED'
        | 'REFUNDED';
      ReceiptStatus: 'ACTIVE' | 'REVERSED';
      RecipientReadStatus: 'UNREAD' | 'READ' | 'ARCHIVED';
      RefundStatus: 'CONFIRMED' | 'FAILED';
      ResidentDocumentCategory:
        | 'PROFILE_PHOTOGRAPH'
        | 'IDENTITY_DOCUMENT'
        | 'OWNERSHIP_DOCUMENT'
        | 'TENANCY_AGREEMENT'
        | 'OTHER';
      ResidentDocumentStatus: 'ACTIVE' | 'REPLACED' | 'ARCHIVED';
      ResidentIDCardStatus: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
      ResidentStatus:
        | 'ACTIVE'
        | 'SUSPENDED'
        | 'MOVED_OUT'
        | 'INACTIVE'
        | 'ARCHIVED';
      SalaryAdjustmentType:
        | 'ALLOWANCE'
        | 'DEDUCTION'
        | 'DEBIT_CORRECTION'
        | 'CREDIT_CORRECTION';
      SalaryFrequency: 'MONTHLY' | 'WEEKLY' | 'DAILY';
      SalaryPaymentMethod:
        | 'CASH'
        | 'BANK_TRANSFER'
        | 'CHEQUE'
        | 'DIGITAL_TRANSFER'
        | 'OTHER';
      SalaryPaymentStatus: 'CONFIRMED' | 'REVERSED' | 'PARTIALLY_REVERSED';
      SalaryRecordStatus:
        | 'DRAFT'
        | 'PENDING'
        | 'PARTIALLY_PAID'
        | 'PAID'
        | 'ON_HOLD'
        | 'CANCELLED'
        | 'REVERSED';
      SalarySlipStatus: 'ACTIVE' | 'REVERSED';
      ScheduleReservationStatus: 'RESERVED' | 'CANCELLED' | 'COMPLETED';
      SocietyStatus: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
      StaffStatus:
        | 'ACTIVE'
        | 'PROBATION'
        | 'ON_LEAVE'
        | 'SUSPENDED'
        | 'RESIGNED'
        | 'TERMINATED'
        | 'RETIRED'
        | 'ARCHIVED';
      TicketAttachmentStatus: 'ACTIVE' | 'ARCHIVED';
      TicketMessageVisibility:
        | 'RESIDENT_VISIBLE'
        | 'INTERNAL'
        | 'WORKER_OPERATIONAL';
      TicketPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EMERGENCY';
      TicketType: 'COMPLAINT' | 'MAINTENANCE';
      UnitStatus: 'AVAILABLE' | 'OCCUPIED' | 'INACTIVE' | 'ARCHIVED';
      WorkerAssignmentStatus: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
      WorkerRelationship: 'INTERNAL' | 'EXTERNAL_CONTRACTOR';
      WorkerStatus:
        | 'AVAILABLE'
        | 'BUSY'
        | 'OFF_DUTY'
        | 'ON_LEAVE'
        | 'SUSPENDED'
        | 'INACTIVE'
        | 'ARCHIVED';
      WorkforceDocumentStatus: 'ACTIVE' | 'ARCHIVED';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  api: {
    Enums: {},
  },
  public: {
    Enums: {
      AccountStatus: [
        'INVITED',
        'ACTIVE',
        'SUSPENDED',
        'DEACTIVATED',
        'ARCHIVED',
      ],
      AdjustmentType: [
        'FIXED_DISCOUNT',
        'PERCENTAGE_DISCOUNT',
        'PARTIAL_WAIVER',
        'FULL_WAIVER',
        'DEBIT_ADJUSTMENT',
        'CREDIT_ADJUSTMENT',
        'CORRECTION',
      ],
      AllocationStrategy: [
        'OLDEST_DUE_FIRST',
        'SELECTED_DUES',
        'CURRENT_MONTH',
        'ALL_OUTSTANDING',
        'ADVANCE',
      ],
      AnnouncementStatus: [
        'DRAFT',
        'SCHEDULED',
        'PUBLISHED',
        'EXPIRED',
        'CANCELLED',
      ],
      AppointmentStatus: [
        'PROPOSED',
        'CONFIRMED',
        'RESCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'MISSED',
      ],
      AudienceType: [
        'ALL_RESIDENTS',
        'SELECTED_RESIDENTS',
        'SELECTED_BLOCKS',
        'SELECTED_UNITS',
        'OWNERS',
        'TENANTS',
        'STAFF',
        'WORKERS',
        'ADMINISTRATORS',
        'CUSTOM',
      ],
      AuditOutcome: ['SUCCESS', 'FAILURE', 'DENIED'],
      AvailabilityOverrideType: ['AVAILABLE', 'UNAVAILABLE', 'LEAVE'],
      ComplaintPrivacy: ['STANDARD', 'RESTRICTED', 'CONFIDENTIAL'],
      ComplaintStatus: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'ASSIGNED',
        'IN_PROGRESS',
        'WAITING_FOR_RESIDENT',
        'RESOLVED',
        'REJECTED',
        'CLOSED',
        'REOPENED',
      ],
      DeliveryStatus: [
        'QUEUED',
        'PROCESSING',
        'ACCEPTED',
        'DELIVERED',
        'FAILED',
        'RETRYING',
        'SKIPPED',
        'CANCELLED',
        'EXPIRED',
      ],
      DueLineItemType: [
        'PRINCIPAL',
        'LATE_FEE',
        'DEBIT_ADJUSTMENT',
        'DISCOUNT',
        'WAIVER',
      ],
      DueStatus: [
        'UPCOMING',
        'PENDING',
        'PARTIALLY_PAID',
        'PAID',
        'OVERDUE',
        'WAIVED',
        'CANCELLED',
        'UNDER_REVIEW',
      ],
      EmploymentType: [
        'PERMANENT',
        'CONTRACT',
        'PART_TIME',
        'TEMPORARY',
        'DAILY_WAGE',
        'OTHER',
      ],
      EscalationKind: [
        'RESPONSE_DUE',
        'RESPONSE_OVERDUE',
        'RESOLUTION_DUE',
        'RESOLUTION_OVERDUE',
      ],
      FailureClassification: [
        'TEMPORARY',
        'PERMANENT',
        'INVALID_RECIPIENT',
        'PROVIDER_DISABLED',
        'UNKNOWN',
      ],
      FeePlanScope: ['SOCIETY_DEFAULT', 'PROPERTY_TYPE', 'UNIT'],
      FinancialBatchStatus: [
        'PREVIEWED',
        'PROCESSING',
        'COMPLETED',
        'PARTIALLY_COMPLETED',
        'FAILED',
      ],
      Gender: ['FEMALE', 'MALE', 'OTHER', 'UNDISCLOSED'],
      HouseholdMemberStatus: ['ACTIVE', 'MOVED_OUT', 'INACTIVE'],
      JobClaimStatus: ['CLAIMED', 'COMPLETED', 'FAILED'],
      LateFeeType: ['NONE', 'FIXED', 'PERCENTAGE'],
      LedgerDirection: ['DEBIT', 'CREDIT'],
      LedgerEntryType: [
        'OPENING_BALANCE',
        'MONTHLY_DUE',
        'LATE_FEE',
        'PAYMENT',
        'DISCOUNT',
        'WAIVER',
        'DEBIT_ADJUSTMENT',
        'CREDIT_ADJUSTMENT',
        'REVERSAL',
        'REFUND',
        'ADVANCE_CREDIT',
        'ADVANCE_APPLIED',
      ],
      MaintenanceStatus: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'ASSIGNED',
        'VISIT_SCHEDULED',
        'WORK_IN_PROGRESS',
        'AWAITING_PARTS',
        'WAITING_FOR_RESIDENT',
        'COMPLETED',
        'CANCELLED',
        'REJECTED',
        'REOPENED',
        'CLOSED',
      ],
      NotificationChannel: ['IN_APP', 'EMAIL', 'SMS'],
      NotificationPriority: ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'],
      NotificationStatus: [
        'DRAFT',
        'SCHEDULED',
        'PROCESSING',
        'PARTIALLY_SENT',
        'SENT',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
      ],
      OccupancyType: ['OWNER', 'TENANT'],
      OutboxStatus: ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'],
      PaymentMethod: [
        'CASH',
        'BANK_TRANSFER',
        'CARD_PROVIDER',
        'DIGITAL_WALLET',
        'CHEQUE',
        'OTHER',
      ],
      PaymentStatus: [
        'INITIATED',
        'PENDING_VERIFICATION',
        'CONFIRMED',
        'FAILED',
        'CANCELLED',
        'REVERSED',
        'PARTIALLY_REFUNDED',
        'REFUNDED',
      ],
      ProfileCorrectionStatus: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      PropertyType: ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'OTHER'],
      ProviderTransactionStatus: [
        'CREATED',
        'PENDING',
        'CONFIRMED',
        'FAILED',
        'CANCELLED',
        'REFUNDED',
      ],
      ReceiptStatus: ['ACTIVE', 'REVERSED'],
      RecipientReadStatus: ['UNREAD', 'READ', 'ARCHIVED'],
      RefundStatus: ['CONFIRMED', 'FAILED'],
      ResidentDocumentCategory: [
        'PROFILE_PHOTOGRAPH',
        'IDENTITY_DOCUMENT',
        'OWNERSHIP_DOCUMENT',
        'TENANCY_AGREEMENT',
        'OTHER',
      ],
      ResidentDocumentStatus: ['ACTIVE', 'REPLACED', 'ARCHIVED'],
      ResidentIDCardStatus: ['ACTIVE', 'REVOKED', 'EXPIRED'],
      ResidentStatus: [
        'ACTIVE',
        'SUSPENDED',
        'MOVED_OUT',
        'INACTIVE',
        'ARCHIVED',
      ],
      SalaryAdjustmentType: [
        'ALLOWANCE',
        'DEDUCTION',
        'DEBIT_CORRECTION',
        'CREDIT_CORRECTION',
      ],
      SalaryFrequency: ['MONTHLY', 'WEEKLY', 'DAILY'],
      SalaryPaymentMethod: [
        'CASH',
        'BANK_TRANSFER',
        'CHEQUE',
        'DIGITAL_TRANSFER',
        'OTHER',
      ],
      SalaryPaymentStatus: ['CONFIRMED', 'REVERSED', 'PARTIALLY_REVERSED'],
      SalaryRecordStatus: [
        'DRAFT',
        'PENDING',
        'PARTIALLY_PAID',
        'PAID',
        'ON_HOLD',
        'CANCELLED',
        'REVERSED',
      ],
      SalarySlipStatus: ['ACTIVE', 'REVERSED'],
      ScheduleReservationStatus: ['RESERVED', 'CANCELLED', 'COMPLETED'],
      SocietyStatus: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
      StaffStatus: [
        'ACTIVE',
        'PROBATION',
        'ON_LEAVE',
        'SUSPENDED',
        'RESIGNED',
        'TERMINATED',
        'RETIRED',
        'ARCHIVED',
      ],
      TicketAttachmentStatus: ['ACTIVE', 'ARCHIVED'],
      TicketMessageVisibility: [
        'RESIDENT_VISIBLE',
        'INTERNAL',
        'WORKER_OPERATIONAL',
      ],
      TicketPriority: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY'],
      TicketType: ['COMPLAINT', 'MAINTENANCE'],
      UnitStatus: ['AVAILABLE', 'OCCUPIED', 'INACTIVE', 'ARCHIVED'],
      WorkerAssignmentStatus: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
      WorkerRelationship: ['INTERNAL', 'EXTERNAL_CONTRACTOR'],
      WorkerStatus: [
        'AVAILABLE',
        'BUSY',
        'OFF_DUTY',
        'ON_LEAVE',
        'SUSPENDED',
        'INACTIVE',
        'ARCHIVED',
      ],
      WorkforceDocumentStatus: ['ACTIVE', 'ARCHIVED'],
    },
  },
} as const;
