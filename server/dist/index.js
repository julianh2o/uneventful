"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
// tsx provides __dirname polyfill in ESM mode
const currentDir = __dirname;
const reminderJob_1 = require("./reminderJob");
const auth_1 = require("./auth");
const userRepository_1 = require("./repositories/userRepository");
const eventRepository_1 = require("./repositories/eventRepository");
const db_1 = require("./db");
const sms_1 = require("./sms");
const rateLimit_1 = require("./rateLimit");
const auth_2 = require("./middleware/auth");
const adminConfig_1 = require("./adminConfig");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 2999;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Authentication endpoints
app.post('/api/auth/request', async (req, res) => {
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
app.post('/api/auth/register', async (req, res) => {
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
app.get('/api/auth/verify', async (req, res) => {
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
app.get('/api/auth/me', auth_2.authenticateToken, async (req, res) => {
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
app.patch('/api/auth/me', auth_2.authenticateToken, async (req, res) => {
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
// Endpoint to get form configuration
app.get('/api/forms/:formName', (req, res) => {
    const { formName } = req.params;
    const yamlPath = path_1.default.join(currentDir, '..', 'src', 'config', `${formName}.yaml`);
    try {
        if (!fs_1.default.existsSync(yamlPath)) {
            return res.status(404).json({ error: `Form configuration '${formName}' not found` });
        }
        const fileContents = fs_1.default.readFileSync(yamlPath, 'utf8');
        const formConfig = yaml_1.default.parse(fileContents);
        res.json(formConfig);
    }
    catch (error) {
        console.error('Error reading form configuration:', error);
        res.status(500).json({ error: 'Failed to load form configuration' });
    }
});
// Endpoint to get tasks configuration
app.get('/api/tasks', (_req, res) => {
    const yamlPath = path_1.default.join(currentDir, '..', 'src', 'config', 'tasks.yaml');
    try {
        if (!fs_1.default.existsSync(yamlPath)) {
            return res.status(404).json({ error: 'Tasks configuration not found' });
        }
        const fileContents = fs_1.default.readFileSync(yamlPath, 'utf8');
        const tasksConfig = yaml_1.default.parse(fileContents);
        res.json(tasksConfig);
    }
    catch (error) {
        console.error('Error reading tasks configuration:', error);
        res.status(500).json({ error: 'Failed to load tasks configuration' });
    }
});
// Endpoint to get all events
app.get('/api/events', auth_2.authenticateToken, async (req, res) => {
    try {
        const userEvents = await (0, eventRepository_1.findEventsByUserId)(req.user.id);
        res.json(userEvents);
    }
    catch (error) {
        console.error('Error reading events:', error);
        res.status(500).json({ error: 'Failed to load events' });
    }
});
// Endpoint to get a single event by ID
app.get('/api/events/:id', auth_2.authenticateToken, async (req, res) => {
    try {
        const event = await (0, eventRepository_1.findEventById)(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(event);
    }
    catch (error) {
        console.error('Error reading event:', error);
        res.status(500).json({ error: 'Failed to load event' });
    }
});
// Endpoint to update an event
app.put('/api/events/:id', auth_2.authenticateToken, async (req, res) => {
    try {
        const event = await (0, eventRepository_1.findEventById)(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await (0, eventRepository_1.updateEventData)(req.params.id, req.body);
        res.json({ success: true, id: req.params.id });
    }
    catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});
// Endpoint to update completed tasks for an event
app.patch('/api/events/:id/tasks', auth_2.authenticateToken, async (req, res) => {
    try {
        const event = await (0, eventRepository_1.findEventById)(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event.userId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await (0, eventRepository_1.updateEventTasks)(req.params.id, req.body.completedTasks || []);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating tasks:', error);
        res.status(500).json({ error: 'Failed to update tasks' });
    }
});
// Endpoint to submit an event
app.post('/api/events', auth_2.authenticateToken, async (req, res) => {
    try {
        const newEvent = await (0, eventRepository_1.createEvent)(req.user.id, req.body);
        res.status(201).json({ id: newEvent.id });
    }
    catch (error) {
        console.error('Error saving event:', error);
        res.status(500).json({ error: 'Failed to save event' });
    }
});
// Health check endpoint for Docker and monitoring
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// Endpoint to receive client error reports
app.post('/api/errors', (req, res) => {
    const { message, stack, url, timestamp, type, componentStack } = req.body;
    if (!message || !url || !timestamp || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    console.error('[Client Error]', {
        type,
        message,
        stack,
        url,
        timestamp,
        userAgent: req.headers['user-agent'],
        componentStack,
    });
    res.status(200).json({ received: true });
});
// Serve static files and SPA fallback for client-side routing
// This must be after all API routes
if (process.env.NODE_ENV === 'production') {
    // When running compiled JS, currentDir is /app/server/dist, so we need to go up twice to reach /app
    const buildPath = path_1.default.join(currentDir, '../..', 'build');
    console.log('[DEBUG] Build path:', buildPath);
    app.use(express_1.default.static(buildPath));
    // SPA fallback - use middleware instead of route pattern for Express 5 compatibility
    app.use(function (req, res) {
        res.sendFile(path_1.default.join(buildPath, 'index.html'));
    });
}
// Start the server
// Check for both TypeScript (server/index.ts) and compiled JavaScript (server/dist/index.js) paths
console.log('[DEBUG] process.argv[1]:', process.argv[1]);
if (process.argv[1]?.includes('server/index') || process.argv[1]?.includes('server/dist/index')) {
    console.log('[DEBUG] Starting server...');
    app.listen(PORT, async () => {
        console.log(`Server running on http://localhost:${PORT}`);
        // Test database connection
        try {
            await db_1.prisma.$connect();
            console.log('Database connected successfully');
        }
        catch (error) {
            console.error('Failed to connect to database:', error);
            process.exit(1);
        }
        (0, reminderJob_1.startReminderJob)();
    });
}
else {
    console.log('[DEBUG] Not starting server (condition not met)');
}
exports.default = app;
