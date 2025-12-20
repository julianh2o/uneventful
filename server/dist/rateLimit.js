"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRateLimits = exports.getRateLimitResetTime = exports.incrementRateLimit = exports.isRateLimited = void 0;
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 3; // Max 3 SMS per 15 minutes per phone
const isRateLimited = (phone) => {
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
exports.isRateLimited = isRateLimited;
const incrementRateLimit = (phone) => {
    const now = Date.now();
    const entry = rateLimitStore.get(phone);
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(phone, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        });
    }
    else {
        entry.count++;
    }
};
exports.incrementRateLimit = incrementRateLimit;
const getRateLimitResetTime = (phone) => {
    const entry = rateLimitStore.get(phone);
    if (!entry)
        return null;
    const now = Date.now();
    const remaining = Math.max(0, entry.resetTime - now);
    return Math.ceil(remaining / 1000);
};
exports.getRateLimitResetTime = getRateLimitResetTime;
setInterval(() => {
    const now = Date.now();
    for (const [phone, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(phone);
        }
    }
}, 5 * 60 * 1000);
// Export for testing purposes
const clearRateLimits = () => {
    rateLimitStore.clear();
};
exports.clearRateLimits = clearRateLimits;
