"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEvents = exports.updateEventTasks = exports.updateEventData = exports.findEventsByUserId = exports.findEventById = exports.createEvent = void 0;
const db_1 = require("../db");
// Convert Prisma Event to domain Event
const toDomainEvent = (event) => ({
    id: event.id,
    userId: event.userId,
    data: JSON.parse(event.data),
    createdAt: event.createdAt.toISOString(),
    completedTasks: event.completedTasks ? JSON.parse(event.completedTasks) : undefined,
});
const createEvent = async (userId, data) => {
    const event = await db_1.prisma.event.create({
        data: {
            userId,
            data: JSON.stringify(data),
        },
    });
    return toDomainEvent(event);
};
exports.createEvent = createEvent;
const findEventById = async (id) => {
    const event = await db_1.prisma.event.findUnique({
        where: { id },
    });
    if (!event) {
        return null;
    }
    return toDomainEvent(event);
};
exports.findEventById = findEventById;
const findEventsByUserId = async (userId) => {
    const events = await db_1.prisma.event.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    return events.map(toDomainEvent);
};
exports.findEventsByUserId = findEventsByUserId;
const updateEventData = async (id, data) => {
    const event = await db_1.prisma.event.update({
        where: { id },
        data: { data: JSON.stringify(data) },
    });
    return toDomainEvent(event);
};
exports.updateEventData = updateEventData;
const updateEventTasks = async (id, completedTasks) => {
    const event = await db_1.prisma.event.update({
        where: { id },
        data: {
            completedTasks: JSON.stringify(completedTasks),
        },
    });
    return toDomainEvent(event);
};
exports.updateEventTasks = updateEventTasks;
const getAllEvents = async () => {
    const events = await db_1.prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return events.map(toDomainEvent);
};
exports.getAllEvents = getAllEvents;
