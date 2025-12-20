import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { sendSms } from './sms';
import { getAllEvents, Event } from './repositories/eventRepository';

// tsx provides __dirname polyfill in ESM mode
const currentDir = __dirname;
const TASKS_FILE = path.join(currentDir, '..', 'src', 'config', 'tasks.yaml');

interface Task {
  id: string;
  name: string;
  description: string;
  deadline: number; // days relative to event (positive = before, negative = after)
}

interface TasksConfig {
  tasks: Task[];
}

const readTasks = (): Task[] => {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(TASKS_FILE, 'utf8');
    const config: TasksConfig = YAML.parse(content);
    return config.tasks || [];
  } catch {
    return [];
  }
};

const parseEventDate = (dateStr: string): Date | null => {
  // Expected format: MM/DD/YYYY
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;

  return date;
};

const getDaysDifference = (eventDate: Date, today: Date): number => {
  const eventTime = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((eventTime - todayTime) / (1000 * 60 * 60 * 24));
};

const getTasksDueToday = (event: Event, tasks: Task[], today: Date): Task[] => {
  const eventDateStr = event.data.eventDate as string | undefined;
  if (!eventDateStr) return [];

  const eventDate = parseEventDate(eventDateStr);
  if (!eventDate) return [];

  const daysUntilEvent = getDaysDifference(eventDate, today);
  const completedTasks = event.completedTasks || [];

  return tasks.filter(task => {
    if (completedTasks.includes(task.id)) return false;
    return task.deadline === daysUntilEvent;
  });
};

const formatPhoneNumber = (contact: string): string | null => {
  // Extract digits from contact
  const digits = contact.replace(/\D/g, '');

  // Check if it looks like a phone number (10-11 digits for US)
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return null;
};

export const checkAndSendReminders = async (): Promise<void> => {
  console.log(`[${new Date().toISOString()}] Running daily reminder check...`);

  const events = await getAllEvents();
  const tasks = readTasks();
  const today = new Date();

  for (const event of events) {
    const dueTasks = getTasksDueToday(event, tasks, today);

    if (dueTasks.length === 0) continue;

    const hostContact = event.data.hostContact as string | undefined;
    const hostName = (event.data.hostName as string | undefined) || 'Host';
    const eventName = (event.data.eventName as string | undefined) || 'your event';

    if (!hostContact) {
      console.log(`No contact info for event ${event.id}, skipping...`);
      continue;
    }

    const phoneNumber = formatPhoneNumber(hostContact);
    if (!phoneNumber) {
      console.log(`Contact "${hostContact}" doesn't appear to be a phone number, skipping...`);
      continue;
    }

    const taskNames = dueTasks.map(t => t.name).join(', ');
    const message = `Hi ${hostName}! Reminder: The following tasks for "${eventName}" are due today: ${taskNames}. - uneventful`;

    console.log(`Sending reminder to ${phoneNumber} for tasks: ${taskNames}`);
    const result = await sendSms({ to: phoneNumber, message });

    if (result.success) {
      console.log(`Reminder sent successfully (ID: ${result.messageId})`);
    } else {
      console.error(`Failed to send reminder: ${result.error}`);
    }
  }

  console.log(`[${new Date().toISOString()}] Reminder check complete.`);
};

export const startReminderJob = (): void => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    checkAndSendReminders();
  });

  console.log('Daily reminder job scheduled for 9:00 AM');
};
