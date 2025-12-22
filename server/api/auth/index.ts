import { Router } from 'express';
import {
	generateMagicLinkToken,
	generateSessionToken,
	verifyMagicLinkToken,
	generateMagicLinkUrl,
	formatMagicLinkSms,
} from '../../auth';
import {
	normalizePhoneNumber,
	findUserByPhone,
	createUser,
	findUserById,
	updateUser,
} from '../../repositories/userRepository';
import { sendSms } from '../../sms';
import { isRateLimited, incrementRateLimit, getRateLimitResetTime } from '../../rateLimit';
import { authenticateToken } from '../../middleware/auth';
import { isAdmin } from '../../adminConfig';

const router = Router();

// POST /api/auth/request - Request magic link
router.post('/request', async (req, res) => {
	try {
		const { phone } = req.body;

		if (!phone) {
			return res.status(400).json({
				success: false,
				error: 'Phone number is required',
			});
		}

		const normalizedPhone = normalizePhoneNumber(phone);

		if (isRateLimited(normalizedPhone)) {
			const resetTime = getRateLimitResetTime(normalizedPhone);
			return res.status(429).json({
				success: false,
				error: `Too many requests. Please try again in ${resetTime} seconds.`,
			});
		}

		const existingUser = await findUserByPhone(normalizedPhone);

		if (!existingUser) {
			return res.json({
				success: true,
				requiresRegistration: true,
				message: 'New user detected. Please provide your name.',
			});
		}

		const magicToken = generateMagicLinkToken(existingUser.id, normalizedPhone);
		const magicLinkUrl = generateMagicLinkUrl(magicToken);
		const smsMessage = formatMagicLinkSms(existingUser.firstName, magicLinkUrl);

		const smsResult = await sendSms({
			to: normalizedPhone,
			message: smsMessage,
		});

		if (!smsResult.success) {
			return res.status(500).json({
				success: false,
				error: 'Failed to send SMS. Please try again.',
			});
		}

		incrementRateLimit(normalizedPhone);

		return res.json({
			success: true,
			requiresRegistration: false,
			message: 'Magic link sent! Check your phone.',
		});
	} catch (error) {
		console.error('Error in /api/auth/request:', error);
		return res.status(500).json({
			success: false,
			error: 'An error occurred. Please try again.',
		});
	}
});

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
	try {
		const { phone, firstName, lastName } = req.body;

		if (!phone || !firstName || !lastName) {
			return res.status(400).json({
				success: false,
				error: 'Phone number, first name, and last name are required',
			});
		}

		const normalizedPhone = normalizePhoneNumber(phone);

		if (isRateLimited(normalizedPhone)) {
			const resetTime = getRateLimitResetTime(normalizedPhone);
			return res.status(429).json({
				success: false,
				error: `Too many requests. Please try again in ${resetTime} seconds.`,
			});
		}

		const existingUser = await findUserByPhone(normalizedPhone);
		if (existingUser) {
			return res.status(400).json({
				success: false,
				error: 'User already exists with this phone number',
			});
		}

		const newUser = await createUser({
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			phone: normalizedPhone,
		});

		const magicToken = generateMagicLinkToken(newUser.id, normalizedPhone);
		const magicLinkUrl = generateMagicLinkUrl(magicToken);
		const smsMessage = formatMagicLinkSms(newUser.firstName, magicLinkUrl);

		const smsResult = await sendSms({
			to: normalizedPhone,
			message: smsMessage,
		});

		if (!smsResult.success) {
			return res.status(500).json({
				success: false,
				error: 'User created but failed to send SMS. Please try logging in again.',
			});
		}

		incrementRateLimit(normalizedPhone);

		return res.json({
			success: true,
			message: 'Account created! Magic link sent to your phone.',
		});
	} catch (error) {
		console.error('Error in /api/auth/register:', error);
		return res.status(500).json({
			success: false,
			error: 'Failed to create account. Please try again.',
		});
	}
});

// GET /api/auth/verify - Verify magic link token
router.get('/verify', async (req, res) => {
	try {
		const { token } = req.query;

		if (!token || typeof token !== 'string') {
			return res.status(400).json({
				success: false,
				error: 'Invalid verification link',
			});
		}

		const decoded = verifyMagicLinkToken(token);

		if (!decoded) {
			return res.status(400).json({
				success: false,
				error: 'Invalid or expired magic link. Please request a new one.',
			});
		}

		const user = await findUserById(decoded.userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found',
			});
		}

		const sessionToken = generateSessionToken({
			id: user.id,
			phone: user.phone,
			firstName: user.firstName,
			lastName: user.lastName,
		});

		return res.json({
			success: true,
			sessionToken,
			user: {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				phone: user.phone,
			},
		});
	} catch (error) {
		console.error('Error in /api/auth/verify:', error);
		return res.status(500).json({
			success: false,
			error: 'An error occurred during verification',
		});
	}
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
	try {
		const user = await findUserById(req.user!.id);

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return res.json({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			phone: user.phone,
			email: user.email,
			isActive: user.isActive,
			isAdmin: isAdmin(user.phone),
			isVerified: user.isVerified,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	} catch (error) {
		console.error('Error in /api/auth/me:', error);
		return res.status(500).json({ error: 'Failed to fetch user' });
	}
});

// PATCH /api/auth/me - Update current user
router.patch('/me', authenticateToken, async (req, res) => {
	try {
		const { firstName, lastName } = req.body;

		if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
			return res.status(400).json({ error: 'First name is required' });
		}

		if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
			return res.status(400).json({ error: 'Last name is required' });
		}

		const updatedUser = await updateUser(req.user!.id, {
			firstName: firstName.trim(),
			lastName: lastName.trim(),
		});

		return res.json({
			id: updatedUser.id,
			firstName: updatedUser.firstName,
			lastName: updatedUser.lastName,
			phone: updatedUser.phone,
			email: updatedUser.email,
			isActive: updatedUser.isActive,
			isAdmin: isAdmin(updatedUser.phone),
			isVerified: updatedUser.isVerified,
			createdAt: updatedUser.createdAt,
			updatedAt: updatedUser.updatedAt,
		});
	} catch (error) {
		console.error('Error in /api/auth/me PATCH:', error);
		return res.status(500).json({ error: 'Failed to update profile' });
	}
});

export default router;
