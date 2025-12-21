import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { createUser, writeUsers, readUsers } from '../../userStorage';
import { generateMagicLinkToken, generateSessionToken } from '../../auth';
import { createMockUser } from '../utils/testHelpers';

describe('GET /api/auth/verify', () => {
	const testUser = createMockUser({ name: 'Test User', phone: '+15555551234' });
	let userId: string;

	beforeEach(() => {
		// Create test user
		const user = createUser({
			name: testUser.name,
			phone: testUser.phone,
		});
		userId = user.id;
	});

	afterEach(() => {
		// Clean up test users
		const users = readUsers();
		const cleanedUsers = users.filter((u) => !u.phone.startsWith('+1555555'));
		writeUsers(cleanedUsers);
	});

	describe('Successful Verification', () => {
		it('should return session token and user with valid magic link token', async () => {
			const magicToken = generateMagicLinkToken(userId, testUser.phone);

			const response = await request(app).get(`/api/auth/verify?token=${magicToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.sessionToken).toBeDefined();
			expect(response.body.user).toEqual({
				id: userId,
				name: testUser.name,
				phone: testUser.phone,
			});
		});

		it('should return valid session token that can be used for authentication', async () => {
			const magicToken = generateMagicLinkToken(userId, testUser.phone);

			const verifyResponse = await request(app).get(`/api/auth/verify?token=${magicToken}`);

			expect(verifyResponse.body.sessionToken).toBeDefined();

			// Verify the session token works for authenticated endpoints
			const meResponse = await request(app)
				.get('/api/auth/me')
				.set('Authorization', `Bearer ${verifyResponse.body.sessionToken}`);

			expect(meResponse.status).toBe(200);
			expect(meResponse.body.id).toBe(userId);
		});

		it('should return user data in response', async () => {
			const magicToken = generateMagicLinkToken(userId, testUser.phone);

			const response = await request(app).get(`/api/auth/verify?token=${magicToken}`);

			expect(response.body.user).toBeDefined();
			expect(response.body.user.id).toBe(userId);
			expect(response.body.user.name).toBe(testUser.name);
			expect(response.body.user.phone).toBe(testUser.phone);
		});
	});

	describe('Validation', () => {
		it('should return 400 when token parameter is missing', async () => {
			const response = await request(app).get('/api/auth/verify');

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				error: 'Invalid verification link',
			});
		});

		it('should return 400 when token is empty string', async () => {
			const response = await request(app).get('/api/auth/verify?token=');

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('Invalid verification link');
		});

		it('should return 400 with invalid token format', async () => {
			const response = await request(app).get('/api/auth/verify?token=invalid_token_123');

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				error: 'Invalid or expired magic link. Please request a new one.',
			});
		});

		it('should return 400 with malformed JWT token', async () => {
			const response = await request(app).get('/api/auth/verify?token=not.a.valid.jwt');

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('Invalid or expired');
		});
	});

	describe('Token Type Validation', () => {
		it('should reject session token (wrong token type)', async () => {
			// Generate a session token instead of magic link token
			const sessionToken = generateSessionToken({
				id: userId,
				phone: testUser.phone,
				name: testUser.name,
			});

			const response = await request(app).get(`/api/auth/verify?token=${sessionToken}`);

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain('Invalid or expired');
		});

		it('should only accept magic link tokens', async () => {
			const magicToken = generateMagicLinkToken(userId, testUser.phone);

			const response = await request(app).get(`/api/auth/verify?token=${magicToken}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
		});
	});

	describe('User Not Found', () => {
		it('should return 404 when user does not exist', async () => {
			// Generate token for non-existent user
			const fakeUserId = 'non-existent-user-id';
			const magicToken = generateMagicLinkToken(fakeUserId, '+15555559999');

			const response = await request(app).get(`/api/auth/verify?token=${magicToken}`);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				success: false,
				error: 'User not found',
			});
		});

		it('should not return session token when user not found', async () => {
			const fakeUserId = 'fake-id-123';
			const magicToken = generateMagicLinkToken(fakeUserId, '+15555558888');

			const response = await request(app).get(`/api/auth/verify?token=${magicToken}`);

			expect(response.body.sessionToken).toBeUndefined();
		});
	});
});
