"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reloadSmsConfig = exports.getMessageVariables = exports.formatSmsMessage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const app_root_path_1 = __importDefault(require("app-root-path"));
const SMS_CONFIG_FILE = path_1.default.join(app_root_path_1.default.path, 'src', 'config', 'sms.yml');
let cachedConfig = null;
const loadSmsConfig = () => {
    if (cachedConfig) {
        return cachedConfig;
    }
    try {
        if (!fs_1.default.existsSync(SMS_CONFIG_FILE)) {
            throw new Error(`SMS configuration file not found at ${SMS_CONFIG_FILE}`);
        }
        const content = fs_1.default.readFileSync(SMS_CONFIG_FILE, 'utf8');
        cachedConfig = yaml_1.default.parse(content);
        return cachedConfig;
    }
    catch (error) {
        console.error('Failed to load SMS configuration:', error);
        throw error;
    }
};
/**
 * Format an SMS message using a template from the configuration
 * @param messageKey - The key of the message template in sms.yml
 * @param variables - Object containing variable values for substitution
 * @returns Formatted message string
 */
const formatSmsMessage = (messageKey, variables) => {
    const config = loadSmsConfig();
    const messageTemplate = config.messages[messageKey];
    if (!messageTemplate) {
        throw new Error(`SMS message template "${messageKey}" not found in configuration`);
    }
    let message = messageTemplate.template;
    // Substitute all variables
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
    }
    // Check for any remaining unsubstituted variables
    const remainingPlaceholders = message.match(/{{[^}]+}}/g);
    if (remainingPlaceholders) {
        console.warn(`Warning: Unsubstituted variables in message "${messageKey}":`, remainingPlaceholders);
    }
    return message;
};
exports.formatSmsMessage = formatSmsMessage;
/**
 * Get the list of required variables for a message template
 * @param messageKey - The key of the message template
 * @returns Array of variable names
 */
const getMessageVariables = (messageKey) => {
    const config = loadSmsConfig();
    const messageTemplate = config.messages[messageKey];
    if (!messageTemplate) {
        throw new Error(`SMS message template "${messageKey}" not found in configuration`);
    }
    return messageTemplate.variables;
};
exports.getMessageVariables = getMessageVariables;
/**
 * Reload the SMS configuration (useful for testing or hot-reloading)
 */
const reloadSmsConfig = () => {
    cachedConfig = null;
};
exports.reloadSmsConfig = reloadSmsConfig;
