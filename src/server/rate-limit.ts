/*
  A small fixed-window limiter, per client address and route. It lives in the memory of one server
  instance, which is enough to stop a script hammering one endpoint, and not enough against a
  distributed attack: on Vercel, put a durable limiter (Vercel Firewall rules or a KV counter)
  in front before the integrations go live. docs/operations.md says so too.
*/
type Bucket = { n: number; reset: number };
const buckets = new Map<string, Bucket>();

export function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0] : req.headers.get('x-real-ip') || 'local').trim();
}

/** true when the call is allowed */
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  return ++b.n <= limit;
}

export const _reset = () => buckets.clear();
