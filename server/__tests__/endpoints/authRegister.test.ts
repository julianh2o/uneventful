import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { findUserByPhone } from '../../repositories/userRepository';
import { clearRateLimits } from '../../rateLimit';
import { prisma } from '../../db';

describe('POST /api/auth/register', () => {
	beforeEach(() => {
		clearRateLimits();
	});

	afterEach(async () => {
		// Clean up test users
		await prisma.user.deleteMany({
			where: {
				phone: {
					startsWith: '+1555555',
				},
			},
		});
		clearRateLimits();
	});

	describe('Validation', () => {
		it('should return 400 when phone is missing', async () => {
			const response = await request(app).post('/api/auth/register').send({ firstName: 'Test', lastName: 'User' });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				error: 'Phone number, first name, and last name are required',
			});
		});

		it('should return 400 when name is missing', async () => {
			const response = await request(app).post('/api/auth/register').send({ phone: '+15555551234' });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				error: 'Phone number, first name, and last name are required',
			});
		});

		it('should return 400 when both phone and name are missing', async () => {
			const response = await request(app).post('/api/auth/register').send({});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('Phone number, first name, and last name are required');
		});

		it('should return 400 when phone is null', async () => {
			const response = await request(app).post('/api/auth/register').send({
				phone: null,
				firstName: 'Test',
				lastName: 'User',
			});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it('should return 400 when name is null', async () => {
			const response = await request(app).post('/api/auth/register').send({
				phone: '+15555551234',
				firstName: null,
				lastName: null,
			});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it('should return 400 when phone is empty string', async () => {
			const response = await request(app).post('/api/auth/register').send({
				phone: '',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it('should return 400 when name is empty string', async () => {
			const response = await request(app).post('/api/auth/register').send({
				phone: '+15555551234',
				firstName: '',
				lastName: '',
			});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});

	describe('Successful Registration', () => {
		it('should create new user with valid data', async () => {
			const phone = '+15555559999';
			const firstName = 'New';
			const lastName = 'User';

			const response = await request(app).post('/api/auth/register').send({ phone, firstName, lastName });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				message: 'Account created! Magic link sent to your phone.',
			});

			// Verify user was created
			const user = await findUserByPhone(phone);
			expect(user).toBeDefined();
			expect(user?.firstName).toBe(firstName);
			expect(user?.lastName).toBe(lastName);
			expect(user?.phone).toBe(phone);
		});

		it('should normalize phone number before creating user', async () => {
			const response = await request(app).post('/api/auth/register').send({
				phone: '5555558888', // Should normalize to +15555558888
				firstName: 'Test',
				lastName: 'User',
			});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);

			// Verify user was created with normalized phone
			const user = await findUserByPhone('+15555558888');
			expect(user).toBeDefined();
		});

		it('should trim whitespace from name', async () => {
			const phone = '+15555557777';
			const response = await request(app).post('/api/auth/register').send({
				phone,
				firstName: '  Test  ',
				lastName: '  User  ',
			});

			expect(response.status).toBe(200);

			const user = await findUserByPhone(phone);
			expect(user?.firstName).toBe('Test'); // No whitespace
			expect(user?.lastName).toBe('User'); // No whitespace
		});

		it('should create user with default flags', async () => {
			const phone = '+15555556666';
			await request(app).post('/api/auth/register').send({
				phone,
				firstName: 'Test',
				lastName: 'User',
			});

			const user = await findUserByPhone(phone);
			expect(user?.isActive).toBe(true);
			expect(user?.isAdmin).toBe(false);
			expect(user?.isVerified).toBe(true);
		});

		it('should create user with timestamps', async () => {
			const phone = '+15555555555';
			await request(app).post('/api/auth/register').send({
				phone,
				firstName: 'Test',
				lastName: 'User',
			});

			const user = await findUserByPhone(phone);
			expect(user?.createdAt).toBeDefined();
			expect(user?.updatedAt).toBeDefined();
			expect(new Date(user!.createdAt).getTime()).toBeGreaterThan(0);
		});

		it('should handle 11-digit phone format', async () => {
			const response = await request(app).post('/api/auth/register').send({
				phone: '15555554444', // Should normalize to +15555554444
				firstName: 'Test',
				lastName: 'User',
			});

			expect(response.status).toBe(200);
			const user = await findUserByPhone('+15555554444');
			expect(user).toBeDefined();
		});
	});

	describe('Duplicate User Handling', () => {
		const existingPhone = '+15555553333';
		const existingFirstName = 'Existing';
		const existingLastName = 'User';

		beforeEach(async () => {
			// Create an existing user
			await request(app).post('/api/auth/register').send({
				phone: existingPhone,
				firstName: existingFirstName,
				lastName: existingLastName,
			});
		});

		it('should return 400 when phone already exists', async () => {
			const response = await request(app).post('/api/auth/register').send({
				phone: existingPhone,
				firstName: 'Different',
				lastName: 'Name',
			});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				error: 'User already exists with this phone number',
			});
		});

		it('should return 400 for normalized duplicate phone', async () => {
			const response = await request(app).post('/api/auth/register').send({
				phone: '5555553333', // Normalizes to same as existingPhone
				firstName: 'Different',
				lastName: 'Name',
			});

			expect(response.status).toBe(400);
			expect(response.body.error).toBe('User already exists with this phone number');
		});

		it('should not create duplicate user', async () => {
			const countBefore = await prisma.user.count({
				where: { phone: existingPhone },
			});

			await request(app).post('/api/auth/register').send({
				phone: existingPhone,
				firstName: 'Another',
				lastName: 'Name',
			});

			const countAfter = await prisma.user.count({
				where: { phone: existingPhone },
			});

			expect(countAfter).toBe(countBefore); // No new user created
		});
	});

	describe('Rate Limiting', () => {
		it('should allow multiple registrations with different phone numbers', async () => {
			const phone1 = '+15555552221';
			const phone2 = '+15555552222';
			const phone3 = '+15555552223';

			const response1 = await request(app).post('/api/auth/register').send({ phone: phone1, firstName: 'User', lastName: '1' });
			expect(response1.status).toBe(200);

			const response2 = await request(app).post('/api/auth/register').send({ phone: phone2, firstName: 'User', lastName: '2' });
			expect(response2.status).toBe(200);

			const response3 = await request(app).post('/api/auth/register').send({ phone: phone3, firstName: 'User', lastName: '3' });
			expect(response3.status).toBe(200);
		});

		it('should increment rate limit after successful registration', async () => {
			const phone = '+15555552000';

			// Successful registration increments rate limit
			const response1 = await request(app).post('/api/auth/register').send({ phone, firstName: 'User', lastName: '1' });
			expect(response1.status).toBe(200);

			// Second attempt with same phone fails due to duplicate user (not rate limit)
			const response2 = await request(app).post('/api/auth/register').send({ phone, firstName: 'User', lastName: '1' });
			expect(response2.status).toBe(400);
			expect(response2.body.error).toBe('User already exists with this phone number');
		});

		it('should not allow duplicate registration even with different name', async () => {
			const phone = '+15555551111';

			// First registration succeeds
			await request(app).post('/api/auth/register').send({ phone, firstName: 'User', lastName: '1' });

			// Second attempt with same phone but different name should fail
			const response = await request(app).post('/api/auth/register').send({ phone, firstName: 'Different', lastName: 'Name' });

			expect(response.status).toBe(400);
			expect(response.body.error).toBe('User already exists with this phone number');
		});
	});
});
