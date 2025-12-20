import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

// tsx provides __dirname polyfill in ESM mode
const currentDir = __dirname;
const SMS_CONFIG_FILE = path.join(currentDir, '..', 'src', 'config', 'sms.yml');

interface MessageTemplate {
  template: string;
  variables: string[];
}

interface SmsConfig {
  messages: {
    [key: string]: MessageTemplate;
  };
}

let cachedConfig: SmsConfig | null = null;

const loadSmsConfig = (): SmsConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    if (!fs.existsSync(SMS_CONFIG_FILE)) {
      throw new Error(`SMS configuration file not found at ${SMS_CONFIG_FILE}`);
    }

    const content = fs.readFileSync(SMS_CONFIG_FILE, 'utf8');
    cachedConfig = YAML.parse(content) as SmsConfig;
    return cachedConfig;
  } catch (error) {
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
export const formatSmsMessage = (
  messageKey: string,
  variables: Record<string, string>
): string => {
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
    console.warn(
      `Warning: Unsubstituted variables in message "${messageKey}":`,
      remainingPlaceholders
    );
  }

  return message;
};

/**
 * Get the list of required variables for a message template
 * @param messageKey - The key of the message template
 * @returns Array of variable names
 */
export const getMessageVariables = (messageKey: string): string[] => {
  const config = loadSmsConfig();
  const messageTemplate = config.messages[messageKey];

  if (!messageTemplate) {
    throw new Error(`SMS message template "${messageKey}" not found in configuration`);
  }

  return messageTemplate.variables;
};

/**
 * Reload the SMS configuration (useful for testing or hot-reloading)
 */
export const reloadSmsConfig = (): void => {
  cachedConfig = null;
};
