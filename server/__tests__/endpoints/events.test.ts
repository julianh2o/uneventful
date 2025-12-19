import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { createUser, writeUsers, readUsers } from '../../userStorage';
import { generateSessionToken } from '../../auth';
import { createMockUser } from '../utils/testHelpers';
import fs from 'fs';
import path from 'path';

const EVENTS_FILE = path.join(__dirname, '..', '..', '..', 'data', 'events.json');

describe('Events API Endpoints', () => {
  const testUser1 = createMockUser({ name: 'User 1', phone: '+15555551111' });
  const testUser2 = createMockUser({ name: 'User 2', phone: '+15555552222' });
  let user1Id: string;
  let user2Id: string;
  let user1Token: string;
  let user2Token: string;

  beforeEach(() => {
    // Create test users
    const u1 = createUser({ name: testUser1.name, phone: testUser1.phone });
    const u2 = createUser({ name: testUser2.name, phone: testUser2.phone });
    user1Id = u1.id;
    user2Id = u2.id;
    user1Token = generateSessionToken({ id: u1.id, phone: u1.phone, name: u1.name });
    user2Token = generateSessionToken({ id: u2.id, phone: u2.phone, name: u2.name });
  });

  afterEach(() => {
    // Clean up test users
    const users = readUsers();
    const cleanedUsers = users.filter((u) => !u.phone.startsWith('+1555555'));
    writeUsers(cleanedUsers);

    // Clean up events
    if (fs.existsSync(EVENTS_FILE)) {
      const events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
      const cleanedEvents = events.filter(
        (e: any) => !e.userId || (e.userId !== user1Id && e.userId !== user2Id)
      );
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(cleanedEvents, null, 2));
    }
  });

  describe('POST /api/events', () => {
    it('should create event with valid auth token', async () => {
      const eventData = {
        eventName: 'Test Event',
        eventDate: '12/25/2024',
        eventTime: '7:00 PM',
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBeTruthy();
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app).post('/api/events').send({});

      expect(response.status).toBe(401);
    });

    it('should associate event with authenticated user', async () => {
      const eventData = { eventName: 'User 1 Event' };

      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(eventData);

      const eventId = createResponse.body.id;

      // Verify the event belongs to user1
      const getResponse = await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.userId).toBe(user1Id);
    });
  });

  describe('GET /api/events', () => {
    beforeEach(async () => {
      // Create events for both users
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ eventName: 'User 1 Event A' });
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ eventName: 'User 1 Event B' });
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ eventName: 'User 2 Event' });
    });

    it('should return only events for authenticated user', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body.every((e: any) => e.userId === user1Id)).toBe(true);
    });

    it('should return empty array for user with no events', async () => {
      const newUser = createUser({ name: 'New User', phone: '+15555553333' });
      const newUserToken = generateSessionToken({
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
      });

      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${newUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/events');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/events/:id', () => {
    let eventId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ eventName: 'Test Event' });
      eventId = response.body.id;
    });

    it('should return event for owner', async () => {
      const response = await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(eventId);
      expect(response.body.data.eventName).toBe('Test Event');
    });

    it('should return 403 for non-owner', async () => {
      const response = await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/non-existent-id')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Event not found');
    });

    it('should require authentication', async () => {
      const response = await request(app).get(`/api/events/${eventId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/events/:id', () => {
    let eventId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ eventName: 'Original Event' });
      eventId = response.body.id;
    });

    it('should update event for owner', async () => {
      const updatedData = { eventName: 'Updated Event', eventDate: '01/01/2025' };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the update
      const getResponse = await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(getResponse.body.data).toEqual(updatedData);
    });

    it('should return 403 for non-owner', async () => {
      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ eventName: 'Hacked Event' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .put('/api/events/non-existent-id')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ eventName: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Event not found');
    });

    it('should require authentication', async () => {
      const response = await request(app).put(`/api/events/${eventId}`).send({ eventName: 'Test' });

      expect(response.status).toBe(401);
    });
  });
});
