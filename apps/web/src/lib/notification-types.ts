export interface NotificationDashboard {
  sentToday: number;
  scheduled: number;
  failed: number;
  unread: number;
  recentAnnouncements: Array<{
    id: string;
    subject: string;
    category: string;
    publishAt: string | null;
  }>;
}
export interface InboxItem {
  id: string;
  readStatus: string;
  readAt: string | null;
  createdAt: string;
  notification: {
    id: string;
    subject: string | null;
    renderedContent: string;
    notificationType: string;
    priority: string;
    expiresAt: string | null;
  };
}
export interface InboxPage {
  items: InboxItem[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
}
export interface TemplatePage {
  items: Array<{
    id: string;
    name: string;
    notificationType: string;
    channel: string;
    active: boolean;
    publishedVersion: number;
    updatedAt: string;
  }>;
  total: number;
}
export interface AnnouncementPage {
  items: Array<{
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    publishAt: string | null;
    emergency: boolean;
    _count: { snapshots: number };
  }>;
  total: number;
}
export interface DeliveryPage {
  items: Array<{
    id: string;
    channel: string;
    status: string;
    destinationMasked: string | null;
    retryCount: number;
    failureReason: string | null;
    createdAt: string;
    recipient: {
      user: { username: string; displayName: string };
      notification: { notificationType: string; subject: string | null };
    };
  }>;
  total: number;
}
export interface NotificationPreference {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  paymentReminders: boolean;
  generalAnnouncements: boolean;
  maintenanceUpdates: boolean;
  complaintUpdates: boolean;
  optionalEvents: boolean;
  preferredLanguage: string;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}
