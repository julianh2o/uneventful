"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
}
const client = accountSid && authToken ? (0, twilio_1.default)(accountSid, authToken) : null;
const sendSms = async ({ to, message }) => {
    if (!client || !fromNumber) {
        return { success: false, error: 'Twilio is not configured' };
    }
    try {
        const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: to,
        });
        return { success: true, messageId: result.sid };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to send SMS:', errorMessage, error);
        return { success: false, error: errorMessage };
    }
};
exports.sendSms = sendSms;
