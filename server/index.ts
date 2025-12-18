import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import YAML from 'yaml';
import { startReminderJob } from './reminderJob';

const EVENTS_FILE = path.join(__dirname, '..', 'data', 'events.json');

interface Event {
  id: string;
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
app.get('/api/events', (req, res) => {
  try {
    const events = readEvents();
    res.json(events);
  } catch (error) {
    console.error('Error reading events:', error);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// Endpoint to get a single event by ID
app.get('/api/events/:id', (req, res) => {
  try {
    const events = readEvents();
    const event = events.find((e) => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error reading event:', error);
    res.status(500).json({ error: 'Failed to load event' });
  }
});

// Endpoint to update an event
app.put('/api/events/:id', (req, res) => {
  try {
    const events = readEvents();
    const eventIndex = events.findIndex((e) => e.id === req.params.id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
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
app.patch('/api/events/:id/tasks', (req, res) => {
  try {
    const events = readEvents();
    const eventIndex = events.findIndex((e) => e.id === req.params.id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
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
app.post('/api/events', (req, res) => {
  try {
    const events = readEvents();
    const newEvent: Event = {
      id: uuidv4(),
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
