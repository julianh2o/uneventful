import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import YAML from 'yaml';
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
  initializeUsersFile,
} from './userStorage';
import { sendSms } from './sms';
import { isRateLimited, incrementRateLimit, getRateLimitResetTime } from './rateLimit';
import { authenticateToken } from './middleware/auth';

const EVENTS_FILE = path.join(__dirname, '..', 'data', 'events.json');

interface Event {
  id: string;
  userId: string;
  data: Record<string, unknown>;
  createdAt: string;
  completedTasks?: string[];
}

const readEvents = (): Event[] => {
  try {
    if (!fs.existsSync(EVENTS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(EVENTS_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
};

const writeEvents = (events: Event[]): void => {
  const dir = path.dirname(EVENTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize users file
initializeUsersFile();

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

    const existingUser = findUserByPhone(normalizedPhone);

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

    const existingUser = findUserByPhone(normalizedPhone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this phone number',
      });
    }

    const newUser = createUser({
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

app.get('/api/auth/verify', (req, res) => {
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

    const user = findUserById(decoded.userId);

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

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = findUserById(req.user!.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Endpoint to get form configuration
app.get('/api/forms/:formName', (req, res) => {
  const { formName } = req.params;
  const yamlPath = path.join(__dirname, '..', 'src', 'config', `${formName}.yaml`);

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
app.get('/api/tasks', (req, res) => {
  const yamlPath = path.join(__dirname, '..', 'src', 'config', 'tasks.yaml');

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
app.get('/api/events', authenticateToken, (req, res) => {
  try {
    const events = readEvents();
    const userEvents = events.filter((e) => e.userId === req.user!.id);
    res.json(userEvents);
  } catch (error) {
    console.error('Error reading events:', error);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// Endpoint to get a single event by ID
app.get('/api/events/:id', authenticateToken, (req, res) => {
  try {
    const events = readEvents();
    const event = events.find((e) => e.id === req.params.id);
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
app.put('/api/events/:id', authenticateToken, (req, res) => {
  try {
    const events = readEvents();
    const eventIndex = events.findIndex((e) => e.id === req.params.id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (events[eventIndex].userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    events[eventIndex].data = req.body;
    writeEvents(events);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Endpoint to update completed tasks for an event
app.patch('/api/events/:id/tasks', authenticateToken, (req, res) => {
  try {
    const events = readEvents();
    const eventIndex = events.findIndex((e) => e.id === req.params.id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (events[eventIndex].userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    events[eventIndex].completedTasks = req.body.completedTasks || [];
    writeEvents(events);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating tasks:', error);
    res.status(500).json({ error: 'Failed to update tasks' });
  }
});

// Endpoint to submit an event
app.post('/api/events', authenticateToken, (req, res) => {
  try {
    const events = readEvents();
    const newEvent: Event = {
      id: uuidv4(),
      userId: req.user!.id,
      data: req.body,
      createdAt: new Date().toISOString(),
    };
    events.push(newEvent);
    writeEvents(events);
    res.status(201).json({ id: newEvent.id });
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
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

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startReminderJob();
  });
}

export default app;
