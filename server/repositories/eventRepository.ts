import { prisma } from '../db';
import { Event as PrismaEvent } from '@prisma/client';

export interface Event {
	id: string;
	userId: string;
	data: Record<string, unknown>;
	createdAt: string; // ISO 8601 string for compatibility
	completedTasks?: string[];
}

// Convert Prisma Event to domain Event
const toDomainEvent = (event: PrismaEvent): Event => ({
	id: event.id,
	userId: event.userId,
	data: JSON.parse(event.data),
	createdAt: event.createdAt.toISOString(),
	completedTasks: event.completedTasks ? JSON.parse(event.completedTasks) : undefined,
});

export const createEvent = async (userId: string, data: Record<string, unknown>): Promise<Event> => {
	const event = await prisma.event.create({
		data: {
			userId,
			data: JSON.stringify(data),
		},
	});

	return toDomainEvent(event);
};

export const findEventById = async (id: string): Promise<Event | null> => {
	const event = await prisma.event.findUnique({
		where: { id },
	});

	if (!event) {
		return null;
	}

	return toDomainEvent(event);
};

export const findEventsByUserId = async (userId: string): Promise<Event[]> => {
	const events = await prisma.event.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
	});

	return events.map(toDomainEvent);
};

export const updateEventData = async (id: string, data: Record<string, unknown>): Promise<Event> => {
	const event = await prisma.event.update({
		where: { id },
		data: { data: JSON.stringify(data) },
	});

	return toDomainEvent(event);
};

export const updateEventTasks = async (id: string, completedTasks: string[]): Promise<Event> => {
	const event = await prisma.event.update({
		where: { id },
		data: {
			completedTasks: JSON.stringify(completedTasks),
		},
	});

	return toDomainEvent(event);
};

export const getAllEvents = async (): Promise<Event[]> => {
	const events = await prisma.event.findMany({
		orderBy: { createdAt: 'desc' },
	});

	return events.map(toDomainEvent);
};
