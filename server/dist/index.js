"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
// tsx provides __dirname polyfill in ESM mode
const currentDir = __dirname;
const reminderJob_1 = require("./reminderJob");
const db_1 = require("./db");
const api_1 = __importDefault(require("./api"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 2999;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Mount API routes
app.use('/api', api_1.default);
// Serve static files and SPA fallback for client-side routing
// This must be after all API routes
if (process.env.NODE_ENV === 'production') {
    // When running compiled JS, currentDir is /app/server/dist, so we need to go up twice to reach /app
    const buildPath = path_1.default.join(currentDir, '../..', 'build');
    console.log('[DEBUG] Build path:', buildPath);
    app.use(express_1.default.static(buildPath));
    // SPA fallback - use middleware instead of route pattern for Express 5 compatibility
    app.use(function (_req, res) {
        res.sendFile(path_1.default.join(buildPath, 'index.html'));
    });
}
// Start the server
// Check for both TypeScript (server/index.ts) and compiled JavaScript (server/dist/index.js) paths
console.log('[DEBUG] process.argv[1]:', process.argv[1]);
if (process.argv[1]?.includes('server/index') || process.argv[1]?.includes('server/dist/index')) {
    console.log('[DEBUG] Starting server...');
    app.listen(PORT, async () => {
        console.log(`Server running on http://localhost:${PORT}`);
        // Test database connection
        try {
            await db_1.prisma.$connect();
            console.log('Database connected successfully');
        }
        catch (error) {
            console.error('Failed to connect to database:', error);
            process.exit(1);
        }
        (0, reminderJob_1.startReminderJob)();
    });
}
else {
    console.log('[DEBUG] Not starting server (condition not met)');
}
exports.default = app;
