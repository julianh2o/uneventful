"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReminderJob = exports.checkAndSendReminders = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const app_root_path_1 = __importDefault(require("app-root-path"));
const sms_1 = require("./sms");
const eventRepository_1 = require("./repositories/eventRepository");
const smsMessages_1 = require("./smsMessages");
const TASKS_FILE = path_1.default.join(app_root_path_1.default.path, 'src', 'config', 'tasks.yaml');
const readTasks = () => {
    try {
        if (!fs_1.default.existsSync(TASKS_FILE)) {
            return [];
        }
        const content = fs_1.default.readFileSync(TASKS_FILE, 'utf8');
        const config = yaml_1.default.parse(content);
        return config.tasks || [];
    }
    catch {
        return [];
    }
};
const parseEventDate = (dateStr) => {
    // Expected format: MM/DD/YYYY
    const parts = dateStr.split('/');
    if (parts.length !== 3)
        return null;
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime()))
        return null;
    return date;
};
const getDaysDifference = (eventDate, today) => {
    const eventTime = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return Math.round((eventTime - todayTime) / (1000 * 60 * 60 * 24));
};
const getTasksDueToday = (event, tasks, today) => {
    const eventDateStr = event.data.eventDate;
    if (!eventDateStr)
        return [];
    const eventDate = parseEventDate(eventDateStr);
    if (!eventDate)
        return [];
    const daysUntilEvent = getDaysDifference(eventDate, today);
    const completedTasks = event.completedTasks || [];
    return tasks.filter(task => {
        if (completedTasks.includes(task.id))
            return false;
        return task.deadline === daysUntilEvent;
    });
};
const formatPhoneNumber = (contact) => {
    // Extract digits from contact
    const digits = contact.replace(/\D/g, '');
    // Check if it looks like a phone number (10-11 digits for US)
    if (digits.length === 10) {
        return `+1${digits}`;
    }
    else if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
    }
    return null;
};
const checkAndSendReminders = async () => {
    console.log(`[${new Date().toISOString()}] Running daily reminder check...`);
    const events = await (0, eventRepository_1.getAllEvents)();
    const tasks = readTasks();
    const today = new Date();
    for (const event of events) {
        const dueTasks = getTasksDueToday(event, tasks, today);
        if (dueTasks.length === 0)
            continue;
        const hostContact = event.data.hostContact;
        const hostName = event.data.hostName || 'Host';
        const eventName = event.data.eventName || 'your event';
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
        const message = (0, smsMessages_1.formatSmsMessage)('taskReminder', {
            hostName,
            eventName,
            taskNames,
        });
        console.log(`Sending reminder to ${phoneNumber} for tasks: ${taskNames}`);
        const result = await (0, sms_1.sendSms)({ to: phoneNumber, message });
        if (result.success) {
            console.log(`Reminder sent successfully (ID: ${result.messageId})`);
        }
        else {
            console.error(`Failed to send reminder: ${result.error}`);
        }
    }
    console.log(`[${new Date().toISOString()}] Reminder check complete.`);
};
exports.checkAndSendReminders = checkAndSendReminders;
const startReminderJob = () => {
    // Run every day at 9:00 AM
    node_cron_1.default.schedule('0 9 * * *', () => {
        (0, exports.checkAndSendReminders)();
    });
    console.log('Daily reminder job scheduled for 9:00 AM');
};
exports.startReminderJob = startReminderJob;
