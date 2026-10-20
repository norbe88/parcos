/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ParcOS Mail Hub — TypeScript UI Interfaces (Sprint 3: PMH-301)
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Dark Luxury Aesthetics
 * ════════════════════════════════════════════════════════════════════════════════
 */

export type MailThreadStatus = 
  | 'UNREAD' 
  | 'READ' 
  | 'PENDING_OFFER' 
  | 'OFFER_SENT' 
  | 'RESERVED' 
  | 'ARCHIVED';

export interface MailAttachmentItem {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageDriver: 'S3_TEMP' | 'GDRIVE_VAULT';
  storageKey: string;
}

export interface MailMessageItem {
  id: string;
  threadId: string;
  messageId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sender: string;
  recipient: string;
  bodyHtml?: string | null;
  bodyText?: string | null;
  isRead: boolean;
  createdAt: string;
  attachments?: MailAttachmentItem[];
}

export interface MailThreadItem {
  id: string;
  dealer_id: string;
  assigned_account_id?: string | null;
  vehicle_id?: string | null;
  subject: string;
  customer_email: string;
  customer_name?: string | null;
  status: MailThreadStatus;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_price?: number | null;
  vehicle_vin?: string | null;
  assigned_agent_name?: string | null;
  assigned_agent_email?: string | null;
  assigned_agent_role?: string | null;
}

export interface MailFolderStats {
  unread_count: number;
  pending_offer_count: number;
  offer_sent_count: number;
  reserved_count: number;
  archived_count: number;
  unassigned_count?: number;
  total_count: number;
}

export interface MailAccountItem {
  id: string;
  dealer_id: string;
  user_id?: string | null;
  email: string;
  display_name: string;
  role: 'ADMIN' | 'SALES' | 'MECHANIC' | 'FINANCE' | 'SUPPORT';
  is_active: boolean;
  user_name?: string | null;
  created_at: string;
}
