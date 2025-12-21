import { Router } from 'express';
import {
	createEvent,
	findEventById,
	findEventsByUserId,
	updateEventData,
	updateEventTasks,
} from '../../repositories/eventRepository';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// GET /api/events - List all events for the current user
router.get('/', authenticateToken, async (req, res) => {
	try {
		const userEvents = await findEventsByUserId(req.user!.id);
		res.json(userEvents);
	} catch (error) {
		console.error('Error reading events:', error);
		res.status(500).json({ error: 'Failed to load events' });
	}
});

// GET /api/events/:id - Get a single event by ID
router.get('/:id', authenticateToken, async (req, res) => {
	try {
		const event = await findEventById(req.params.id);
		if (!event) {
			return res.status(404).json({ error: 'Event not found' });
		}
		if (event.userId !== req.user!.id) {
			return res.status(403).json({ error: 'Access denied' });
		}
		res.json(event);
	} catch (error) {
		console.error('Error reading event:', error);
		res.status(500).json({ error: 'Failed to load event' });
	}
});

// PUT /api/events/:id - Update an event
router.put('/:id', authenticateToken, async (req, res) => {
	try {
		const event = await findEventById(req.params.id);
		if (!event) {
			return res.status(404).json({ error: 'Event not found' });
		}
		if (event.userId !== req.user!.id) {
			return res.status(403).json({ error: 'Access denied' });
		}
		await updateEventData(req.params.id, req.body);
		res.json({ success: true, id: req.params.id });
	} catch (error) {
		console.error('Error updating event:', error);
		res.status(500).json({ error: 'Failed to update event' });
	}
});

// PATCH /api/events/:id/tasks - Update completed tasks for an event
router.patch('/:id/tasks', authenticateToken, async (req, res) => {
	try {
		const event = await findEventById(req.params.id);
		if (!event) {
			return res.status(404).json({ error: 'Event not found' });
		}
		if (event.userId !== req.user!.id) {
			return res.status(403).json({ error: 'Access denied' });
		}
		await updateEventTasks(req.params.id, req.body.completedTasks || []);
		res.json({ success: true });
	} catch (error) {
		console.error('Error updating tasks:', error);
		res.status(500).json({ error: 'Failed to update tasks' });
	}
});

// POST /api/events - Create a new event
router.post('/', authenticateToken, async (req, res) => {
	try {
		const newEvent = await createEvent(req.user!.id, req.body);
		res.status(201).json({ id: newEvent.id });
	} catch (error) {
		console.error('Error saving event:', error);
		res.status(500).json({ error: 'Failed to save event' });
	}
});

export default router;
