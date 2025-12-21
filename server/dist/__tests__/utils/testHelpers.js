"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTestUsers = exports.readTestUsers = exports.createTestEvent = exports.createTestUser = exports.getTestDataPath = exports.cleanTestData = exports.createMockEvent = exports.createMockUser = void 0;
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Creates a mock user with default values that can be overridden
 */
const createMockUser = (overrides) => {
    const timestamp = new Date().toISOString();
    return {
        id: (0, uuid_1.v4)(),
        name: 'Test User',
        phone: '+15555551234',
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
        isAdmin: false,
        isVerified: true,
        ...overrides,
    };
};
exports.createMockUser = createMockUser;
/**
 * Creates a mock event with default values that can be overridden
 */
const createMockEvent = (overrides) => {
    const timestamp = new Date().toISOString();
    return {
        id: (0, uuid_1.v4)(),
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
exports.createMockEvent = createMockEvent;
/**
 * Cleans up test data files
 */
const cleanTestData = () => {
    const currentDir = path_1.default.join(__dirname, '..', '..');
    const testDataDir = path_1.default.join(currentDir, '..', 'data', 'test');
    if (fs_1.default.existsSync(testDataDir)) {
        fs_1.default.rmSync(testDataDir, { recursive: true, force: true });
    }
};
exports.cleanTestData = cleanTestData;
/**
 * Gets the path for test-specific data files
 */
const getTestDataPath = (filename) => {
    const currentDir = path_1.default.join(__dirname, '..', '..');
    return path_1.default.join(currentDir, '..', 'data', 'test', filename);
};
exports.getTestDataPath = getTestDataPath;
/**
 * Creates a test user directly (bypassing createUser function)
 */
const createTestUser = (userData = {}) => {
    return (0, exports.createMockUser)({
        name: userData.name || 'Test User',
        phone: userData.phone ||
            `+1555${Math.floor(Math.random() * 10000000)
                .toString()
                .padStart(7, '0')}`,
        ...userData,
    });
};
exports.createTestUser = createTestUser;
/**
 * Creates a test event directly (bypassing event creation endpoints)
 */
const createTestEvent = (eventData = {}) => {
    return (0, exports.createMockEvent)({
        ...eventData,
    });
};
exports.createTestEvent = createTestEvent;
/**
 * Reads users from the test users file
 */
const readTestUsers = (filePath) => {
    try {
        if (!fs_1.default.existsSync(filePath)) {
            return [];
        }
        const content = fs_1.default.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        return [];
    }
};
exports.readTestUsers = readTestUsers;
/**
 * Writes users to the test users file
 */
const writeTestUsers = (filePath, users) => {
    const dir = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    fs_1.default.writeFileSync(filePath, JSON.stringify(users, null, 2));
};
exports.writeTestUsers = writeTestUsers;
