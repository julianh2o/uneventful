"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUsersFile = exports.normalizePhoneNumber = exports.updateUser = exports.createUser = exports.findUserById = exports.findUserByPhone = void 0;
const db_1 = require("../db");
// Convert Prisma User to StoredUser (maintains backward compatibility with ISO 8601 strings)
const toDomainUser = (user) => ({
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
const findUserByPhone = async (phone) => {
    const user = await db_1.prisma.user.findFirst({
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
exports.findUserByPhone = findUserByPhone;
const findUserById = async (id) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id },
    });
    if (!user || user.deletedAt) {
        return null;
    }
    return toDomainUser(user);
};
exports.findUserById = findUserById;
const createUser = async (userData) => {
    // Check for existing user
    const existing = await (0, exports.findUserByPhone)(userData.phone);
    if (existing) {
        throw new Error('User with this phone number already exists');
    }
    const user = await db_1.prisma.user.create({
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
exports.createUser = createUser;
const updateUser = async (id, updates) => {
    const user = await db_1.prisma.user.update({
        where: { id },
        data: updates,
    });
    return toDomainUser(user);
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
// No-op for backward compatibility - database is initialized via Prisma migrations
const initializeUsersFile = () => {
    // No-op - database is initialized via Prisma migrations
};
exports.initializeUsersFile = initializeUsersFile;
