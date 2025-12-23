import { v4 as uuidv4 } from 'uuid';
import { StoredUser } from '../../repositories/userRepository';
import fs from 'fs';
import path from 'path';

// Event interface matching server/index.ts
export interface Event {
	id: string;
	userId: string;
	data: Record<string, unknown>;
	createdAt: string;
	completedTasks?: string[];
}

/**
 * Creates a mock user with default values that can be overridden
 */
export const createMockUser = (overrides?: Partial<StoredUser>): StoredUser => {
	const timestamp = new Date().toISOString();
	return {
		id: uuidv4(),
		firstName: 'Test',
		lastName: 'User',
		phone: '+15555551234',
		createdAt: timestamp,
		updatedAt: timestamp,
		isActive: true,
		isAdmin: false,
		isVerified: true,
		...overrides,
	};
};

/**
 * Creates a mock event with default values that can be overridden
 */
export const createMockEvent = (overrides?: Partial<Event>): Event => {
	const timestamp = new Date().toISOString();
	return {
		id: uuidv4(),
		userId: 'test-user-id',
		data: {
			eventName: 'Test Event',
			eventDate: '12/25/2024',
			eventTime: '7:00 PM',
		},
		createdAt: timestamp,
		completedTasks: [],
		...overrides,
	};
};

/**
 * Cleans up test data files
 */
export const cleanTestData = (): void => {
	const currentDir = path.join(__dirname, '..', '..');
	const testDataDir = path.join(currentDir, '..', 'data', 'test');

	if (fs.existsSync(testDataDir)) {
		fs.rmSync(testDataDir, { recursive: true, force: true });
	}
};

/**
 * Gets the path for test-specific data files
 */
export const getTestDataPath = (filename: string): string => {
	const currentDir = path.join(__dirname, '..', '..');
	return path.join(currentDir, '..', 'data', 'test', filename);
};

/**
 * Creates a test user directly (bypassing createUser function)
 */
export const createTestUser = (userData: Partial<StoredUser> = {}): StoredUser => {
	return createMockUser({
		firstName: userData.firstName || 'Test',
		lastName: userData.lastName || 'User',
		phone:
			userData.phone ||
			`+1555${Math.floor(Math.random() * 10000000)
				.toString()
				.padStart(7, '0')}`,
		...userData,
	});
};

/**
 * Creates a test event directly (bypassing event creation endpoints)
 */
export const createTestEvent = (eventData: Partial<Event> = {}): Event => {
	return createMockEvent({
		...eventData,
	});
};

/**
 * Reads users from the test users file
 */
export const readTestUsers = (filePath: string): StoredUser[] => {
	try {
		if (!fs.existsSync(filePath)) {
			return [];
		}
		const content = fs.readFileSync(filePath, 'utf8');
		return JSON.parse(content);
	} catch (error) {
		return [];
	}
};

/**
 * Writes users to the test users file
 */
export const writeTestUsers = (filePath: string, users: StoredUser[]): void => {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
};
