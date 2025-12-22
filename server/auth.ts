import jwt from 'jsonwebtoken';
import { formatSmsMessage } from './smsMessages';
import { config } from './config';

const MAGIC_LINK_EXPIRY = '15m';
const SESSION_EXPIRY = '30d';

export interface MagicLinkToken {
	userId: string;
	phone: string;
	type: 'magic_link';
	exp: number;
}

export interface SessionToken {
	userId: string;
	phone: string;
	firstName: string;
	lastName: string;
	type: 'session';
	exp: number;
}

export const generateMagicLinkToken = (userId: string, phone: string): string => {
	const payload: Omit<MagicLinkToken, 'exp'> = {
		userId,
		phone,
		type: 'magic_link',
	};

	return jwt.sign(payload, config.auth.jwtSecret, { expiresIn: MAGIC_LINK_EXPIRY });
};

export const generateSessionToken = (user: { id: string; phone: string; firstName: string; lastName: string }): string => {
	const payload: Omit<SessionToken, 'exp'> = {
		userId: user.id,
		phone: user.phone,
		firstName: user.firstName,
		lastName: user.lastName,
		type: 'session',
	};

	return jwt.sign(payload, config.auth.jwtSecret, { expiresIn: SESSION_EXPIRY });
};

export const verifyMagicLinkToken = (token: string): MagicLinkToken | null => {
	try {
		const decoded = jwt.verify(token, config.auth.jwtSecret) as MagicLinkToken;

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
		const decoded = jwt.verify(token, config.auth.jwtSecret) as SessionToken;

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
	return `${config.auth.appBaseUrl}/auth/verify?token=${token}`;
};

export const formatMagicLinkSms = (firstName: string, magicLinkUrl: string): string => {
	return formatSmsMessage('magicLink', {
		name: firstName,
		magicLinkUrl,
	});
};
