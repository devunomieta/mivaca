import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const createRequestSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title must not exceed 150 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  category_id: z
    .number({ message: 'Please select a category' })
    .int()
    .positive('Please select a valid category'),
  location: z
    .string()
    .min(3, 'Location must be at least 3 characters')
    .max(200, 'Location must not exceed 200 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    message: 'Please select a priority level',
  }),
  evidence_urls: z.array(z.string().url()).max(5, 'Maximum 5 files allowed').optional(),
});

export const updateRequestSchema = z.object({
  status: z
    .enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  title: z.string().min(5).max(150).optional(),
  description: z.string().min(20).max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export const assignRequestSchema = z.object({
  officer_id: z.string().uuid('Please select a valid officer'),
  notes: z.string().max(500).optional(),
});

export const statusUpdateSchema = z.object({
  request_id: z.string().uuid(),
  new_status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']),
  remarks: z.string().max(500).optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type AssignRequestInput = z.infer<typeof assignRequestSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;

// Client-side file validation helper
export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'File must be smaller than 5MB';
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) return 'Only images and PDF files are allowed';
  return null;
}
