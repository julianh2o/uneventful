import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { createUser, writeUsers, readUsers } from '../../userStorage';
import { clearRateLimits } from '../../rateLimit';
import { createMockUser } from '../utils/testHelpers';

describe('POST /api/auth/request', () => {
  const testPhone = '+15555551234';
  const testUser = createMockUser({ phone: testPhone, name: 'Test User' });

  beforeEach(() => {
    // Clear rate limits before each test
    clearRateLimits();
  });

  afterEach(() => {
    // Clean up test users
    const users = readUsers();
    const cleanedUsers = users.filter((u) => !u.phone.startsWith('+1555555'));
    writeUsers(cleanedUsers);
    clearRateLimits();
  });

  describe('Validation', () => {
    it('should return 400 when phone number is missing', async () => {
      const response = await request(app).post('/api/auth/request').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Phone number is required',
      });
    });

    it('should return 400 when phone is null', async () => {
      const response = await request(app).post('/api/auth/request').send({ phone: null });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Phone number is required');
    });

    it('should return 400 when phone is empty string', async () => {
      const response = await request(app).post('/api/auth/request').send({ phone: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('New User Flow', () => {
    it('should return requiresRegistration: true for new user', async () => {
      const newPhone = '+15555559999';
      const response = await request(app).post('/api/auth/request').send({ phone: newPhone });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        requiresRegistration: true,
        message: 'New user detected. Please provide your name.',
      });
    });

    it('should normalize phone number before checking', async () => {
      const response = await request(app).post('/api/auth/request').send({ phone: '5555559999' });

      expect(response.status).toBe(200);
      expect(response.body.requiresRegistration).toBe(true);
    });

    it('should not send SMS for new user', async () => {
      const newPhone = '+15555558888';
      const response = await request(app).post('/api/auth/request').send({ phone: newPhone });

      expect(response.body.requiresRegistration).toBe(true);
      // If SMS was sent, the response would be different
      expect(response.body.message).not.toContain('Magic link sent');
    });
  });

  describe('Existing User Flow', () => {
    beforeEach(() => {
      // Create a test user
      createUser({
        name: testUser.name,
        phone: testUser.phone,
      });
    });

    it('should return requiresRegistration: false for existing user', async () => {
      const response = await request(app).post('/api/auth/request').send({ phone: testPhone });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        requiresRegistration: false,
        message: 'Magic link sent! Check your phone.',
      });
    });

    it('should send SMS to existing user', async () => {
      const response = await request(app).post('/api/auth/request').send({ phone: testPhone });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Magic link sent');
    });

    it('should work with non-normalized phone for existing user', async () => {
      const response = await request(app).post('/api/auth/request').send({
        phone: '5555551234', // Should normalize to +15555551234
      });

      expect(response.status).toBe(200);
      expect(response.body.requiresRegistration).toBe(false);
    });

    it('should work with 11-digit phone (1XXXXXXXXXX)', async () => {
      const response = await request(app).post('/api/auth/request').send({
        phone: '15555551234', // Should normalize to +15555551234
      });

      expect(response.status).toBe(200);
      expect(response.body.requiresRegistration).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      createUser({
        name: testUser.name,
        phone: testUser.phone,
      });
    });

    it('should allow requests within rate limit', async () => {
      // First request
      const response1 = await request(app).post('/api/auth/request').send({ phone: testPhone });
      expect(response1.status).toBe(200);

      // Second request
      const response2 = await request(app).post('/api/auth/request').send({ phone: testPhone });
      expect(response2.status).toBe(200);

      // Third request
      const response3 = await request(app).post('/api/auth/request').send({ phone: testPhone });
      expect(response3.status).toBe(200);
    });

    it('should return 429 after exceeding rate limit', async () => {
      // Make 3 requests (the limit)
      await request(app).post('/api/auth/request').send({ phone: testPhone });
      await request(app).post('/api/auth/request').send({ phone: testPhone });
      await request(app).post('/api/auth/request').send({ phone: testPhone });

      // 4th request should be rate limited
      const response = await request(app).post('/api/auth/request').send({ phone: testPhone });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Too many requests');
    });

    it('should include reset time in rate limit error', async () => {
      // Exceed rate limit
      await request(app).post('/api/auth/request').send({ phone: testPhone });
      await request(app).post('/api/auth/request').send({ phone: testPhone });
      await request(app).post('/api/auth/request').send({ phone: testPhone });

      const response = await request(app).post('/api/auth/request').send({ phone: testPhone });

      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/Please try again in \d+ seconds/);
    });

    it('should track rate limits independently for different phones', async () => {
      const phone2 = '+15555557777';
      createUser({ name: 'Another User', phone: phone2 });

      // Exceed limit for first phone
      await request(app).post('/api/auth/request').send({ phone: testPhone });
      await request(app).post('/api/auth/request').send({ phone: testPhone });
      await request(app).post('/api/auth/request').send({ phone: testPhone });

      // Fourth request for first phone should be blocked
      const response1 = await request(app).post('/api/auth/request').send({ phone: testPhone });
      expect(response1.status).toBe(429);

      // But second phone should still work
      const response2 = await request(app).post('/api/auth/request').send({ phone: phone2 });
      expect(response2.status).toBe(200);
      expect(response2.body.success).toBe(true);
    });

    it('should check rate limit before checking user existence', async () => {
      // Exceed rate limit with existing user
      await request(app).post('/api/auth/request').send({ phone: testPhone });
      await request(app).post('/api/auth/request').send({ phone: testPhone });
      await request(app).post('/api/auth/request').send({ phone: testPhone });

      // Should return 429 even for new phone (same normalized number)
      const response = await request(app).post('/api/auth/request').send({ phone: testPhone });
      expect(response.status).toBe(429);
    });
  });
});
