import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { startReminderJob } from './reminderJob';
import { prisma } from './db';
import apiRouter from './api';
import { getBuildPath } from './utils/paths';

const app = express();
const PORT = process.env.PORT || 2999;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Serve static files and SPA fallback for client-side routing
// This must be after all API routes
if (process.env.NODE_ENV === 'production') {
	const buildPath = getBuildPath();
	console.log('[DEBUG] Build path:', buildPath);

	app.use(express.static(buildPath));

	// SPA fallback - use middleware instead of route pattern for Express 5 compatibility
	app.use(function (_req, res) {
		res.sendFile(path.join(buildPath, 'index.html'));
	});
}

// Start the server
// Check for TypeScript (server/index.ts), old compiled (server/dist/index.js), or new compiled (build/index.js) paths
console.log('[DEBUG] process.argv[1]:', process.argv[1]);
if (process.argv[1]?.includes('server/index') || process.argv[1]?.includes('server/dist/index') || process.argv[1]?.includes('build/index')) {
	console.log('[DEBUG] Starting server...');
	app.listen(PORT, async () => {
		console.log(`Server running on http://localhost:${PORT}`);

		// Test database connection
		try {
			await prisma.$connect();
			console.log('Database connected successfully');
		} catch (error) {
			console.error('Failed to connect to database:', error);
			process.exit(1);
		}

		startReminderJob();
	});
} else {
	console.log('[DEBUG] Not starting server (condition not met)');
}

export default app;
