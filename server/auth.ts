import jwt from 'jsonwebtoken';
import { formatSmsMessage } from './smsMessages';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MAGIC_LINK_EXPIRY = '15m';
const SESSION_EXPIRY = '30d';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:2998';

export interface MagicLinkToken {
  userId: string;
  phone: string;
  type: 'magic_link';
  exp: number;
}

export interface SessionToken {
  userId: string;
  phone: string;
  name: string;
  type: 'session';
  exp: number;
}

export const generateMagicLinkToken = (userId: string, phone: string): string => {
  const payload: Omit<MagicLinkToken, 'exp'> = {
    userId,
    phone,
    type: 'magic_link',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAGIC_LINK_EXPIRY });
};

export const generateSessionToken = (user: { id: string; phone: string; name: string }): string => {
  const payload: Omit<SessionToken, 'exp'> = {
    userId: user.id,
    phone: user.phone,
    name: user.name,
    type: 'session',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY });
};

export const verifyMagicLinkToken = (token: string): MagicLinkToken | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MagicLinkToken;

    if (decoded.type !== 'magic_link') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Magic link token verification failed:', error);
    return null;
  }
};

export const verifySessionToken = (token: string): SessionToken | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionToken;

    if (decoded.type !== 'session') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Session token verification failed:', error);
    return null;
  }
};

export const generateMagicLinkUrl = (token: string): string => {
  return `${APP_BASE_URL}/auth/verify?token=${token}`;
};

export const formatMagicLinkSms = (name: string, magicLinkUrl: string): string => {
  return formatSmsMessage('magicLink', {
    name,
    magicLinkUrl,
  });
};
