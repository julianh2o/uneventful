import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
	console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

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
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Failed to send SMS:', errorMessage, error);
		return { success: false, error: errorMessage };
	}
};
