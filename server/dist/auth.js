"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMagicLinkSms = exports.generateMagicLinkUrl = exports.verifySessionToken = exports.verifyMagicLinkToken = exports.generateSessionToken = exports.generateMagicLinkToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MAGIC_LINK_EXPIRY = '15m';
const SESSION_EXPIRY = '30d';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:2998';
const generateMagicLinkToken = (userId, phone) => {
    const payload = {
        userId,
        phone,
        type: 'magic_link',
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: MAGIC_LINK_EXPIRY });
};
exports.generateMagicLinkToken = generateMagicLinkToken;
const generateSessionToken = (user) => {
    const payload = {
        userId: user.id,
        phone: user.phone,
        name: user.name,
        type: 'session',
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY });
};
exports.generateSessionToken = generateSessionToken;
const verifyMagicLinkToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== 'magic_link') {
            return null;
        }
        return decoded;
    }
    catch (error) {
        console.error('Magic link token verification failed:', error);
        return null;
    }
};
exports.verifyMagicLinkToken = verifyMagicLinkToken;
const verifySessionToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== 'session') {
            return null;
        }
        return decoded;
    }
    catch (error) {
        console.error('Session token verification failed:', error);
        return null;
    }
};
exports.verifySessionToken = verifySessionToken;
const generateMagicLinkUrl = (token) => {
    return `${APP_BASE_URL}/auth/verify?token=${token}`;
};
exports.generateMagicLinkUrl = generateMagicLinkUrl;
const formatMagicLinkSms = (name, magicLinkUrl) => {
    const greeting = name ? `Hi ${name}!` : 'Hi!';
    return `${greeting} Click here to sign in to uneventful: ${magicLinkUrl}

This link expires in 15 minutes.`;
};
exports.formatMagicLinkSms = formatMagicLinkSms;
