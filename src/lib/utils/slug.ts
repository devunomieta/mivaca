export function generateRequestSlug(request: { id: string; title: string; created_at: string }): string {
  // Format: YYYY-MM-DD-sanitized-title-uuid
  const date = new Date(request.created_at).toISOString().split('T')[0];
  const safeTitle = request.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
    
  return `${date}-${safeTitle}-${request.id}`;
}

export function parseRequestIdFromSlug(slug: string): string {
  // Extract the UUID (last 36 characters)
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const match = slug.match(uuidPattern);
  return match ? match[0] : slug;
}
