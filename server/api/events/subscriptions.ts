import { Router } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// POST /api/events/:eventId/subscribe - Subscribe to event notifications
router.post('/:eventId/subscribe', authenticateToken, async (req, res) => {
	try {
		const { eventId } = req.params;
		const userId = req.user!.id;

		// Check if event exists
		const event = await prisma.event.findUnique({
			where: { id: eventId },
		});

		if (!event) {
			return res.status(404).json({ error: 'Event not found' });
		}

		// Create or get existing subscription
		const subscription = await prisma.eventSubscription.upsert({
			where: {
				userId_eventId: {
					userId,
					eventId,
				},
			},
			create: {
				userId,
				eventId,
			},
			update: {},
		});

		return res.json({
			success: true,
			subscribed: true,
			subscription: {
				id: subscription.id,
				createdAt: subscription.createdAt,
			},
		});
	} catch (error) {
		console.error('Error subscribing to event:', error);
		return res.status(500).json({ error: 'Failed to subscribe to event' });
	}
});

// DELETE /api/events/:eventId/subscribe - Unsubscribe from event notifications
router.delete('/:eventId/subscribe', authenticateToken, async (req, res) => {
	try {
		const { eventId } = req.params;
		const userId = req.user!.id;

		// Delete subscription if it exists
		await prisma.eventSubscription.deleteMany({
			where: {
				userId,
				eventId,
			},
		});

		return res.json({
			success: true,
			subscribed: false,
		});
	} catch (error) {
		console.error('Error unsubscribing from event:', error);
		return res.status(500).json({ error: 'Failed to unsubscribe from event' });
	}
});

// GET /api/events/:eventId/subscribe - Check subscription status
router.get('/:eventId/subscribe', authenticateToken, async (req, res) => {
	try {
		const { eventId } = req.params;
		const userId = req.user!.id;

		const subscription = await prisma.eventSubscription.findUnique({
			where: {
				userId_eventId: {
					userId,
					eventId,
				},
			},
		});

		return res.json({
			subscribed: !!subscription,
			subscription: subscription
				? {
						id: subscription.id,
						createdAt: subscription.createdAt,
				  }
				: null,
		});
	} catch (error) {
		console.error('Error checking subscription status:', error);
		return res.status(500).json({ error: 'Failed to check subscription status' });
	}
});

export default router;
