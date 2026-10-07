export function safeAvatarFallback(name: string, isGroup: boolean = false): string {
  let initials = '';
  try {
    const sanitized = (name || '').replace(/[\uD800-\uDFFF]/g, '').trim();
    const match = sanitized.match(/([a-zA-Z0-9\u0900-\u097F])/g);
    if (match && match.length > 0) {
      initials = match.slice(0, 2).join('').toUpperCase();
    }
  } catch {}

  if (!initials) {
    initials = isGroup ? 'GP' : 'WA';
  }

  const bg = isGroup ? '%230f3a40' : '%231f4e3d';
  const color = isGroup ? '%2338bdf8' : '%234ade80';
  const cleanInitials = encodeURIComponent(initials.slice(0, 2));

  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='${bg}'/%3E%3Ctext x='50' y='63' font-family='-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif' font-size='38' font-weight='bold' fill='${color}' text-anchor='middle'%3E${cleanInitials}%3C/text%3E%3C/svg%3E`;
}
