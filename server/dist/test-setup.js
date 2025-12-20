"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const vitest_1 = require("vitest");
// Load test environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '.env.test') });
// Mock Twilio to avoid sending real SMS in tests
vitest_1.vi.mock('twilio', () => ({
    default: vitest_1.vi.fn(() => ({
        messages: {
            create: vitest_1.vi.fn().mockResolvedValue({
                sid: 'test_message_sid',
                status: 'sent',
            }),
        },
    })),
}));
