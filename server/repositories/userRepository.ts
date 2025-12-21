import { prisma } from '../db';
import { User } from '@prisma/client';

export interface StoredUser {
	id: string;
	name: string;
	phone: string;
	email?: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
	isActive: boolean;
	isAdmin: boolean;
	isVerified: boolean;
}

// Convert Prisma User to StoredUser (maintains backward compatibility with ISO 8601 strings)
const toDomainUser = (user: User): StoredUser => ({
	id: user.id,
	name: user.name,
	phone: user.phone,
	email: user.email,
	createdAt: user.createdAt.toISOString(),
	updatedAt: user.updatedAt.toISOString(),
	deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
	isActive: user.isActive,
	isAdmin: user.isAdmin,
	isVerified: user.isVerified,
});

export const findUserByPhone = async (phone: string): Promise<StoredUser | null> => {
	const user = await prisma.user.findFirst({
		where: {
			phone,
			deletedAt: null, // Only active users
		},
	});

	if (!user) {
		return null;
	}

	return toDomainUser(user);
};

export const findUserById = async (id: string): Promise<StoredUser | null> => {
	const user = await prisma.user.findUnique({
		where: { id },
	});

	if (!user || user.deletedAt) {
		return null;
	}

	return toDomainUser(user);
};

export const createUser = async (userData: { name: string; phone: string; email?: string }): Promise<StoredUser> => {
	// Check for existing user
	const existing = await findUserByPhone(userData.phone);
	if (existing) {
		throw new Error('User with this phone number already exists');
	}

	const user = await prisma.user.create({
		data: {
			name: userData.name,
			phone: userData.phone,
			email: userData.email,
			isActive: true,
			isAdmin: false,
			isVerified: true,
		},
	});

	return toDomainUser(user);
};

export const updateUser = async (
	id: string,
	updates: Partial<Omit<StoredUser, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<StoredUser> => {
	const user = await prisma.user.update({
		where: { id },
		data: updates,
	});

	return toDomainUser(user);
};

export const normalizePhoneNumber = (phone: string): string => {
	// Remove all non-digit characters except leading '+'
	let cleaned = phone.trim();
	const hasPlus = cleaned.startsWith('+');

	// Strip everything except digits
	const digits = cleaned.replace(/\D/g, '');

	// If already had a + prefix and has digits, use as-is
	if (hasPlus && digits.length > 0) {
		return `+${digits}`;
	}

	// 10 digits: assume US number, add +1
	if (digits.length === 10) {
		return `+1${digits}`;
	}

	// 11 digits starting with 1: US number with country code
	if (digits.length === 11 && digits.startsWith('1')) {
		return `+${digits}`;
	}

	// Any other format: add + and use as-is
	return `+${digits}`;
};

// No-op for backward compatibility - database is initialized via Prisma migrations
export const initializeUsersFile = (): void => {
	// No-op - database is initialized via Prisma migrations
};
