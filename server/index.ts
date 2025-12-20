import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

// tsx provides __dirname polyfill in ESM mode
const currentDir = __dirname;
import { startReminderJob } from './reminderJob';
import {
  generateMagicLinkToken,
  generateSessionToken,
  verifyMagicLinkToken,
  generateMagicLinkUrl,
  formatMagicLinkSms,
} from './auth';
import {
  normalizePhoneNumber,
  findUserByPhone,
  createUser,
  findUserById,
  updateUser,
} from './repositories/userRepository';
import {
  createEvent,
  findEventById,
  findEventsByUserId,
  updateEventData,
  updateEventTasks,
} from './repositories/eventRepository';
import { prisma } from './db';
import { sendSms } from './sms';
import { isRateLimited, incrementRateLimit, getRateLimitResetTime } from './rateLimit';
import { authenticateToken } from './middleware/auth';
import { isAdmin } from './adminConfig';

const app = express();
const PORT = process.env.PORT || 2999;

app.use(cors());
app.use(express.json());

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
    const smsMessage = formatMagicLinkSms(existingUser.name, magicLinkUrl);

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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and name are required',
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
      name: name.trim(),
      phone: normalizedPhone,
    });

    const magicToken = generateMagicLinkToken(newUser.id, normalizedPhone);
    const magicLinkUrl = generateMagicLinkUrl(magicToken);
    const smsMessage = formatMagicLinkSms(newUser.name, magicLinkUrl);

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

app.get('/api/auth/verify', async (req, res) => {
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
  } catch (error) {
    console.error('Error in /api/auth/verify:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during verification',
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.user!.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      name: user.name,
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

app.patch('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updatedUser = await updateUser(req.user!.id, { name: name.trim() });

    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
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

// Endpoint to get form configuration
app.get('/api/forms/:formName', (req, res) => {
  const { formName } = req.params;
  const yamlPath = path.join(currentDir, '..', 'src', 'config', `${formName}.yaml`);

  try {
    if (!fs.existsSync(yamlPath)) {
      return res.status(404).json({ error: `Form configuration '${formName}' not found` });
    }

    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const formConfig = YAML.parse(fileContents);

    res.json(formConfig);
  } catch (error) {
    console.error('Error reading form configuration:', error);
    res.status(500).json({ error: 'Failed to load form configuration' });
  }
});

// Endpoint to get tasks configuration
app.get('/api/tasks', (_req, res) => {
  const yamlPath = path.join(currentDir, '..', 'src', 'config', 'tasks.yaml');

  try {
    if (!fs.existsSync(yamlPath)) {
      return res.status(404).json({ error: 'Tasks configuration not found' });
    }

    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const tasksConfig = YAML.parse(fileContents);

    res.json(tasksConfig);
  } catch (error) {
    console.error('Error reading tasks configuration:', error);
    res.status(500).json({ error: 'Failed to load tasks configuration' });
  }
});

// Endpoint to get all events
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const userEvents = await findEventsByUserId(req.user!.id);
    res.json(userEvents);
  } catch (error) {
    console.error('Error reading events:', error);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// Endpoint to get a single event by ID
app.get('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const event = await findEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error reading event:', error);
    res.status(500).json({ error: 'Failed to load event' });
  }
});

// Endpoint to update an event
app.put('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const event = await findEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await updateEventData(req.params.id, req.body);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Endpoint to update completed tasks for an event
app.patch('/api/events/:id/tasks', authenticateToken, async (req, res) => {
  try {
    const event = await findEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await updateEventTasks(req.params.id, req.body.completedTasks || []);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating tasks:', error);
    res.status(500).json({ error: 'Failed to update tasks' });
  }
});

// Endpoint to submit an event
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const newEvent = await createEvent(req.user!.id, req.body);
    res.status(201).json({ id: newEvent.id });
  } catch (error) {
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

// Catch-all route to serve React app for client-side routing
// This must be after all API routes
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(currentDir, '..', 'build')));

  app.get('/*', function (req, res) {
    res.sendFile(path.join(currentDir, '..', 'build', 'index.html'));
  });
}

// Start the server
if (process.argv[1]?.includes('server/index')) {
  app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      process.exit(1);
    }

    startReminderJob();
  });
}

export default app;
