/**
 * Modelos de domínio compartilhados (web + mobile).
 * Para os tipos exatos gerados do banco, rode `pnpm db:types`
 * (gera packages/shared/src/database.types.ts).
 */
export type UserRole = 'student' | 'admin' | 'owner';
export type PlanInterval = 'free' | 'month' | 'year' | 'one_time';
export type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
export type LibraryType =
  | 'ebook' | 'modelo' | 'checklist' | 'act' | 'cct' | 'politica' | 'jurisprudencia';
export type EventType = 'mentoria' | 'live' | 'evento' | 'webinar';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'canceled' | 'refunded';
export type ProductType = 'course' | 'book' | 'plan' | 'mentorship';
export type NotifAudience = 'owner' | 'user';
export type NotifType =
  | 'purchase' | 'course_completed' | 'course_abandoned' | 'new_signup'
  | 'new_forum_post' | 'event_reminder' | 'subscription_canceled' | 'system';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  role: UserRole;
  bio: string | null;
  fiscal: Record<string, unknown>;
  notify_prefs: { email?: boolean; push?: boolean };
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: PlanInterval;
  stripe_price_id: string | null;
  features: string[];
  highlight: boolean;
  active: boolean;
  sort_order: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  trailer_url: string | null;
  instructor: string | null;
  category: string | null;
  level: string | null;
  price_cents: number;
  is_free: boolean;
  required_plan_id: string | null;
  duration_minutes: number;
  published: boolean;
  sort_order: number;
}

export interface Module { id: string; course_id: string; title: string; sort_order: number; }

export interface Lesson {
  id: string;
  module_id: string | null;
  course_id: string;
  title: string;
  description: string | null;
  video_provider: 'upload' | 'youtube' | 'vimeo' | 'mux' | 'external';
  video_url: string | null;
  storage_path: string | null;
  duration_seconds: number;
  attachments: { name: string; url: string }[];
  is_preview: boolean;
  published: boolean;
  sort_order: number;
}

export interface Enrollment {
  id: string; user_id: string; course_id: string;
  source: 'purchase' | 'plan' | 'manual' | 'free';
  progress_pct: number;
  started_at: string | null; completed_at: string | null; last_activity_at: string | null;
}

export interface LessonProgress {
  id: string; user_id: string; lesson_id: string; course_id: string;
  seconds_watched: number; completed: boolean; completed_at: string | null;
}

export interface Certificate {
  id: string; user_id: string; course_id: string; code: string; issued_at: string; pdf_url: string | null;
}

export interface LibraryItem {
  id: string; title: string; description: string | null; type: LibraryType;
  file_url: string | null; storage_path: string | null; cover_url: string | null;
  category: string | null; tags: string[]; required_plan_id: string | null;
  is_free: boolean; published: boolean; download_count: number; created_at: string;
}

export interface EventItem {
  id: string; title: string; description: string | null; type: EventType;
  starts_at: string; ends_at: string | null; location: string | null; join_url: string | null;
  cover_url: string | null; required_plan_id: string | null; capacity: number | null; published: boolean;
}

export interface ForumCategory { id: string; name: string; slug: string; description: string | null; sort_order: number; }
export interface ForumThread {
  id: string; category_id: string | null; user_id: string; title: string; slug: string | null;
  body: string; pinned: boolean; locked: boolean; views: number; reply_count: number;
  last_activity_at: string; created_at: string;
}
export interface ForumPost { id: string; thread_id: string; user_id: string; body: string; created_at: string; }

export interface NewsItem { id: string; title: string; summary: string | null; body: string | null; url: string | null; source: string | null; cover_url: string | null; published_at: string; }
export interface Announcement { id: string; title: string; body: string | null; level: 'info' | 'success' | 'warning'; created_at: string; }
export interface PlatformUpdate { id: string; version: string | null; title: string; body: string | null; created_at: string; }

export interface Book { id: string; title: string; slug: string; author: string | null; description: string | null; cover_url: string | null; price_cents: number; stock: number; weight_grams: number; pages: number | null; published: boolean; }
export interface Mentorship { id: string; title: string; slug: string; description: string | null; format: string | null; price_cents: number; cover_url: string | null; published: boolean; }

export interface Notification {
  id: string; audience: NotifAudience; user_id: string | null; type: NotifType;
  title: string; body: string | null; data: Record<string, unknown>; read_at: string | null; created_at: string;
}

export interface AiCitation { content: string; document_id: string; similarity: number; }
export interface AiMessage { id: string; conversation_id: string; role: 'user' | 'assistant' | 'system'; content: string; citations: AiCitation[]; created_at: string; }
export interface AiConversation { id: string; user_id: string; title: string | null; created_at: string; }
