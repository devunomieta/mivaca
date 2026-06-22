// =============================================================================
// Global TypeScript Types — Miva Campus Maintenance Platform
// =============================================================================

export type Role = 'student' | 'maintenance_officer' | 'admin';

export type RequestStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type RequestPriority = 'low' | 'medium' | 'high' | 'critical';

// -----------------------------------------------
// Database Entity Types
// -----------------------------------------------

export interface RoleRecord {
  id: number;
  name: Role;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role_id: number;
  department: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles?: RoleRecord;
}

export interface RequestCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  requester_id: string;
  category_id: number;
  title: string;
  description: string;
  location: string;
  priority: RequestPriority;
  status: RequestStatus;
  evidence_urls: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Profile;
  request_categories?: RequestCategory;
  assignments?: Assignment[];
}

export interface Assignment {
  id: string;
  request_id: string;
  officer_id: string;
  assigned_by: string;
  assigned_at: string;
  notes: string | null;
  // Joined
  profiles?: Profile;
}

export interface StatusLog {
  id: string;
  request_id: string;
  changed_by: string;
  old_status: RequestStatus | null;
  new_status: RequestStatus;
  remarks: string | null;
  created_at: string;
  // Joined
  profiles?: Profile;
}

// -----------------------------------------------
// API Response Types
// -----------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// -----------------------------------------------
// Filter & Query Types
// -----------------------------------------------

export interface RequestFilters {
  status?: RequestStatus | 'all';
  category?: number | 'all';
  priority?: RequestPriority | 'all';
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'updated_at' | 'priority';
  order?: 'asc' | 'desc';
}

// -----------------------------------------------
// Auth Types
// -----------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

export interface SessionData {
  user: AuthUser;
  role: Role;
}

// -----------------------------------------------
// Dashboard Stats Types
// -----------------------------------------------

export interface RequestStats {
  total: number;
  pending: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export interface AdminStats extends RequestStats {
  resolution_rate: number;
  total_officers: number;
  total_students: number;
}
