import dotenv from 'dotenv';
import path from 'path';
import { vi } from 'vitest';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '.env.test') });

// Mock Twilio to avoid sending real SMS in tests
vi.mock('twilio', () => ({
	default: vi.fn(() => ({
		messages: {
			create: vi.fn().mockResolvedValue({
				sid: 'test_message_sid',
				status: 'sent',
			}),
		},
	})),
}));
