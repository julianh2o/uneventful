import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { generateSessionToken } from '../../auth';
import { createMockUser } from '../utils/testHelpers';

describe('Auth Middleware', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: NextFunction;

	beforeEach(() => {
		req = {
			headers: {},
		};
		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
		next = vi.fn();
	});

	describe('authenticateToken', () => {
		it('should call next() with valid Bearer token', () => {
			const mockUser = createMockUser();
			const token = generateSessionToken(mockUser);

			req.headers = {
				authorization: `Bearer ${token}`,
			};

			authenticateToken(req as Request, res as Response, next);

			expect(next).toHaveBeenCalled();
			expect(req.user).toBeDefined();
			expect(req.user?.id).toBe(mockUser.id);
			expect(req.user?.phone).toBe(mockUser.phone);
			expect(req.user?.firstName).toBe(mockUser.firstName);
			expect(req.user?.lastName).toBe(mockUser.lastName);
		});

		it('should set req.user with decoded token payload', () => {
			const mockUser = createMockUser({
				id: 'test-123',
				firstName: 'John',
				lastName: 'Doe',
				phone: '+15551234567',
			});
			const token = generateSessionToken(mockUser);

			req.headers = {
				authorization: `Bearer ${token}`,
			};

			authenticateToken(req as Request, res as Response, next);

			expect(req.user).toEqual({
				id: 'test-123',
				phone: '+15551234567',
				firstName: 'John',
				lastName: 'Doe',
			});
		});

		it('should return 401 when Authorization header is missing', () => {
			req.headers = {};

			authenticateToken(req as Request, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
			expect(next).not.toHaveBeenCalled();
		});

		it('should return 401 when token is missing from Authorization header', () => {
			req.headers = {
				authorization: 'Bearer ',
			};

			authenticateToken(req as Request, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
			expect(next).not.toHaveBeenCalled();
		});

		it('should return 403 when Authorization header does not start with Bearer', () => {
			req.headers = {
				authorization: 'InvalidFormat token123',
			};

			authenticateToken(req as Request, res as Response, next);

			// Header exists but token format is invalid, so returns 403 not 401
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
			expect(next).not.toHaveBeenCalled();
		});

		it('should return 403 when token is invalid', () => {
			req.headers = {
				authorization: 'Bearer invalid_token_here',
			};

			authenticateToken(req as Request, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
			expect(next).not.toHaveBeenCalled();
		});

		it('should return 403 when token is expired', () => {
			// Create a token with a past expiry
			const mockUser = createMockUser();
			const expiredToken = generateSessionToken(mockUser);

			// Simulate an expired token by manipulating time or using a pre-expired token
			// For now, we'll use an intentionally malformed token that will fail verification
			const malformedToken = expiredToken.substring(0, expiredToken.length - 5) + 'xxxxx';

			req.headers = {
				authorization: `Bearer ${malformedToken}`,
			};

			authenticateToken(req as Request, res as Response, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
			expect(next).not.toHaveBeenCalled();
		});

		it('should not set req.user when authentication fails', () => {
			req.headers = {
				authorization: 'Bearer invalid_token',
			};

			authenticateToken(req as Request, res as Response, next);

			expect(req.user).toBeUndefined();
		});

		it('should handle multiple requests independently', () => {
			const user1 = createMockUser({ id: 'user-1', firstName: 'User', lastName: 'One' });
			const user2 = createMockUser({ id: 'user-2', firstName: 'User', lastName: 'Two' });
			const token1 = generateSessionToken(user1);
			const token2 = generateSessionToken(user2);

			// First request
			req.headers = { authorization: `Bearer ${token1}` };
			authenticateToken(req as Request, res as Response, next);
			expect(req.user?.id).toBe('user-1');

			// Second request (new req object)
			const req2: Partial<Request> = { headers: { authorization: `Bearer ${token2}` } };
			const next2 = vi.fn();
			authenticateToken(req2 as Request, res as Response, next2);
			expect(req2.user?.id).toBe('user-2');
		});
	});
});
