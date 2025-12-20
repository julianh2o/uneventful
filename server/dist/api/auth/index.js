"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../auth");
const userRepository_1 = require("../../repositories/userRepository");
const sms_1 = require("../../sms");
const rateLimit_1 = require("../../rateLimit");
const auth_2 = require("../../middleware/auth");
const adminConfig_1 = require("../../adminConfig");
const router = (0, express_1.Router)();
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
        const normalizedPhone = (0, userRepository_1.normalizePhoneNumber)(phone);
        if ((0, rateLimit_1.isRateLimited)(normalizedPhone)) {
            const resetTime = (0, rateLimit_1.getRateLimitResetTime)(normalizedPhone);
            return res.status(429).json({
                success: false,
                error: `Too many requests. Please try again in ${resetTime} seconds.`,
            });
        }
        const existingUser = await (0, userRepository_1.findUserByPhone)(normalizedPhone);
        if (!existingUser) {
            return res.json({
                success: true,
                requiresRegistration: true,
                message: 'New user detected. Please provide your name.',
            });
        }
        const magicToken = (0, auth_1.generateMagicLinkToken)(existingUser.id, normalizedPhone);
        const magicLinkUrl = (0, auth_1.generateMagicLinkUrl)(magicToken);
        const smsMessage = (0, auth_1.formatMagicLinkSms)(existingUser.name, magicLinkUrl);
        const smsResult = await (0, sms_1.sendSms)({
            to: normalizedPhone,
            message: smsMessage,
        });
        if (!smsResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to send SMS. Please try again.',
            });
        }
        (0, rateLimit_1.incrementRateLimit)(normalizedPhone);
        return res.json({
            success: true,
            requiresRegistration: false,
            message: 'Magic link sent! Check your phone.',
        });
    }
    catch (error) {
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
        const { phone, name } = req.body;
        if (!phone || !name) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and name are required',
            });
        }
        const normalizedPhone = (0, userRepository_1.normalizePhoneNumber)(phone);
        if ((0, rateLimit_1.isRateLimited)(normalizedPhone)) {
            const resetTime = (0, rateLimit_1.getRateLimitResetTime)(normalizedPhone);
            return res.status(429).json({
                success: false,
                error: `Too many requests. Please try again in ${resetTime} seconds.`,
            });
        }
        const existingUser = await (0, userRepository_1.findUserByPhone)(normalizedPhone);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this phone number',
            });
        }
        const newUser = await (0, userRepository_1.createUser)({
            name: name.trim(),
            phone: normalizedPhone,
        });
        const magicToken = (0, auth_1.generateMagicLinkToken)(newUser.id, normalizedPhone);
        const magicLinkUrl = (0, auth_1.generateMagicLinkUrl)(magicToken);
        const smsMessage = (0, auth_1.formatMagicLinkSms)(newUser.name, magicLinkUrl);
        const smsResult = await (0, sms_1.sendSms)({
            to: normalizedPhone,
            message: smsMessage,
        });
        if (!smsResult.success) {
            return res.status(500).json({
                success: false,
                error: 'User created but failed to send SMS. Please try logging in again.',
            });
        }
        (0, rateLimit_1.incrementRateLimit)(normalizedPhone);
        return res.json({
            success: true,
            message: 'Account created! Magic link sent to your phone.',
        });
    }
    catch (error) {
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
        const decoded = (0, auth_1.verifyMagicLinkToken)(token);
        if (!decoded) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired magic link. Please request a new one.',
            });
        }
        const user = await (0, userRepository_1.findUserById)(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const sessionToken = (0, auth_1.generateSessionToken)({
            id: user.id,
            phone: user.phone,
            name: user.name,
        });
        return res.json({
            success: true,
            sessionToken,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
            },
        });
    }
    catch (error) {
        console.error('Error in /api/auth/verify:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred during verification',
        });
    }
});
// GET /api/auth/me - Get current user
router.get('/me', auth_2.authenticateToken, async (req, res) => {
    try {
        const user = await (0, userRepository_1.findUserById)(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            isActive: user.isActive,
            isAdmin: (0, adminConfig_1.isAdmin)(user.phone),
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
    catch (error) {
        console.error('Error in /api/auth/me:', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// PATCH /api/auth/me - Update current user
router.patch('/me', auth_2.authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const updatedUser = await (0, userRepository_1.updateUser)(req.user.id, { name: name.trim() });
        return res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            phone: updatedUser.phone,
            email: updatedUser.email,
            isActive: updatedUser.isActive,
            isAdmin: (0, adminConfig_1.isAdmin)(updatedUser.phone),
            isVerified: updatedUser.isVerified,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        });
    }
    catch (error) {
        console.error('Error in /api/auth/me PATCH:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});
exports.default = router;
