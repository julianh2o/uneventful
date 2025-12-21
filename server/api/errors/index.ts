import { Router } from 'express';

const router = Router();

// POST /api/errors - Receive client error reports
router.post('/', (req, res) => {
	const { message, stack, url, timestamp, type, componentStack } = req.body;

	if (!message || !url || !timestamp || !type) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	console.error('[Client Error]', {
		type,
		message,
		stack,
		url,
		timestamp,
		componentStack,
	});

	res.status(200).json({ received: true });
});

export default router;
