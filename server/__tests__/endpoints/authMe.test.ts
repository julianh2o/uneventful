import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { createUser, writeUsers, readUsers } from '../../userStorage';
import { generateSessionToken } from '../../auth';
import { createMockUser } from '../utils/testHelpers';

describe('GET /api/auth/me', () => {
  const testUser = createMockUser({ name: 'Test User', phone: '+15555551234' });
  let userId: string;
  let sessionToken: string;

  beforeEach(() => {
    // Create test user
    const user = createUser({
      name: testUser.name,
      phone: testUser.phone,
    });
    userId = user.id;
    sessionToken = generateSessionToken({
      id: user.id,
      phone: user.phone,
      name: user.name,
    });
  });

  afterEach(() => {
    // Clean up test users
    const users = readUsers();
    const cleanedUsers = users.filter((u) => !u.phone.startsWith('+1555555'));
    writeUsers(cleanedUsers);
  });

  describe('Successful Authentication', () => {
    it('should return user data with valid session token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: userId,
        name: testUser.name,
        phone: testUser.phone,
      });
    });

    it('should return user with all expected fields', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('phone');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('isActive');
      expect(response.body).toHaveProperty('isAdmin');
    });

    it('should work with Authorization header in correct format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
    });
  });

  describe('Authentication Failures', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should return 401 when token is missing from Authorization header', async () => {
      const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Invalid or expired token' });
    });

    it('should return 403 with malformed JWT', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.jwt.token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should still work even with non-standard prefix (middleware accepts any format with space)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Token ${sessionToken}`); // Non-standard prefix

      // Middleware splits by space and accepts the token regardless of prefix
      // This is current behavior - could be made stricter in future
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
    });
  });

  describe('User Not Found', () => {
    it('should return 404 when user is deleted', async () => {
      // Create a token for user, then delete the user
      const users = readUsers();
      const cleanedUsers = users.filter((u) => u.id !== userId);
      writeUsers(cleanedUsers);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });
});
