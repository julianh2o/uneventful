interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 3; // Max 3 SMS per 15 minutes per phone

export const isRateLimited = (phone: string): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(phone);

  if (!entry) {
    return false;
  }

  if (now > entry.resetTime) {
    rateLimitStore.delete(phone);
    return false;
  }

  return entry.count >= MAX_REQUESTS;
};

export const incrementRateLimit = (phone: string): void => {
  const now = Date.now();
  const entry = rateLimitStore.get(phone);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(phone, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
  } else {
    entry.count++;
  }
};

export const getRateLimitResetTime = (phone: string): number | null => {
  const entry = rateLimitStore.get(phone);
  if (!entry) return null;

  const now = Date.now();
  const remaining = Math.max(0, entry.resetTime - now);
  return Math.ceil(remaining / 1000);
};

setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(phone);
    }
  }
}, 5 * 60 * 1000);
