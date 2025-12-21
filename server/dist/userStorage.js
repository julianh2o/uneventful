"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhoneNumber = exports.updateUser = exports.createUser = exports.findUserById = exports.findUserByPhone = exports.writeUsers = exports.readUsers = exports.initializeUsersFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const app_root_path_1 = __importDefault(require("app-root-path"));
const USERS_FILE = path_1.default.join(app_root_path_1.default.path, 'data', 'users.json');
const initializeUsersFile = () => {
    const dir = path_1.default.dirname(USERS_FILE);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    if (!fs_1.default.existsSync(USERS_FILE)) {
        fs_1.default.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
};
exports.initializeUsersFile = initializeUsersFile;
const readUsers = () => {
    try {
        if (!fs_1.default.existsSync(USERS_FILE)) {
            (0, exports.initializeUsersFile)();
            return [];
        }
        const content = fs_1.default.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
};
exports.readUsers = readUsers;
const writeUsers = (users) => {
    try {
        (0, exports.initializeUsersFile)();
        fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
    catch (error) {
        console.error('Error writing users:', error);
        throw error;
    }
};
exports.writeUsers = writeUsers;
const findUserByPhone = (phone) => {
    const users = (0, exports.readUsers)();
    return users.find((u) => u.phone === phone && !u.deletedAt) || null;
};
exports.findUserByPhone = findUserByPhone;
const findUserById = (id) => {
    const users = (0, exports.readUsers)();
    return users.find((u) => u.id === id && !u.deletedAt) || null;
};
exports.findUserById = findUserById;
const createUser = (userData) => {
    const users = (0, exports.readUsers)();
    const existing = (0, exports.findUserByPhone)(userData.phone);
    if (existing) {
        throw new Error('User with this phone number already exists');
    }
    const newUser = {
        id: (0, uuid_1.v4)(),
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        isAdmin: false,
        isVerified: true,
    };
    users.push(newUser);
    (0, exports.writeUsers)(users);
    return newUser;
};
exports.createUser = createUser;
const updateUser = (id, updates) => {
    const users = (0, exports.readUsers)();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
        throw new Error('User not found');
    }
    users[index] = {
        ...users[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    (0, exports.writeUsers)(users);
    return users[index];
};
exports.updateUser = updateUser;
const normalizePhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
    }
    if (phone.startsWith('+')) {
        return phone;
    }
    return `+${digits}`;
};
exports.normalizePhoneNumber = normalizePhoneNumber;
