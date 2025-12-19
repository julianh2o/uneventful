import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

export interface StoredUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  isActive: boolean;
  isAdmin: boolean;
  isVerified: boolean;
}

export const initializeUsersFile = (): void => {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
};

export const readUsers = (): StoredUser[] => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      initializeUsersFile();
      return [];
    }
    const content = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
};

export const writeUsers = (users: StoredUser[]): void => {
  try {
    initializeUsersFile();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users:', error);
    throw error;
  }
};

export const findUserByPhone = (phone: string): StoredUser | null => {
  const users = readUsers();
  return users.find((u) => u.phone === phone && !u.deletedAt) || null;
};

export const findUserById = (id: string): StoredUser | null => {
  const users = readUsers();
  return users.find((u) => u.id === id && !u.deletedAt) || null;
};

export const createUser = (userData: {
  name: string;
  phone: string;
  email?: string;
}): StoredUser => {
  const users = readUsers();

  const existing = findUserByPhone(userData.phone);
  if (existing) {
    throw new Error('User with this phone number already exists');
  }

  const newUser: StoredUser = {
    id: uuidv4(),
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
  writeUsers(users);
  return newUser;
};

export const updateUser = (id: string, updates: Partial<StoredUser>): StoredUser => {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    throw new Error('User not found');
  }

  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeUsers(users);
  return users[index];
};

export const normalizePhoneNumber = (phone: string): string => {
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
