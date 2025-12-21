"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_libsql_1 = require("@prisma/adapter-libsql");
// Create Prisma adapter with database URL
const adapter = new adapter_libsql_1.PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./data/uneventful.db',
});
// Singleton pattern to prevent multiple instances
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
// Graceful shutdown
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
