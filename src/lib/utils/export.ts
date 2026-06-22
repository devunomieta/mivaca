import Papa from 'papaparse';
import type { ServiceRequest } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export function exportRequestsToCSV(requests: ServiceRequest[]): string {
  const rows = requests.map((r) => ({
    'Reference ID': r.id.slice(0, 8).toUpperCase(),
    Title: r.title,
    Category: r.request_categories?.name ?? '',
    Requester: r.profiles?.full_name ?? '',
    'Requester Email': r.profiles?.email ?? '',
    Location: r.location,
    Priority: PRIORITY_LABELS[r.priority] ?? r.priority,
    Status: STATUS_LABELS[r.status] ?? r.status,
    'Assigned Officer':
      r.assignments && r.assignments.length > 0
        ? r.assignments[0].profiles?.full_name ?? ''
        : 'Unassigned',
    'Submitted Date': new Date(r.created_at).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    'Last Updated': new Date(r.updated_at).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }));

  return Papa.unparse(rows);
}

export function downloadCSV(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
