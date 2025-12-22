import twilio from 'twilio';
import { config } from './config';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export interface SendSmsParams {
	to: string;
	message: string;
}

export interface SmsResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

export const sendSms = async ({ to, message }: SendSmsParams): Promise<SmsResult> => {
	try {
		const result = await client.messages.create({
			body: message,
			from: config.twilio.phoneNumber,
			to: to,
		});

		return { success: true, messageId: result.sid };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Failed to send SMS:', errorMessage, error);
		return { success: false, error: errorMessage };
	}
};
