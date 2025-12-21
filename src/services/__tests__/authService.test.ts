import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	setAuthToken,
	getAuthToken,
	removeAuthToken,
	isAuthenticated,
	requestMagicLink,
	registerUser,
	verifyMagicLink,
	getCurrentUser,
	logout,
} from '../authService';

// Mock the api module
vi.mock('../../utils/api', () => ({
	getApiBaseUrl: () => 'http://localhost:2999',
}));

describe('authService', () => {
	let fetchMock: ReturnType<typeof vi.fn>;
	let localStorageMock: Record<string, string>;

	beforeEach(() => {
		// Mock fetch
		fetchMock = vi.fn();
		global.fetch = fetchMock;

		// Mock localStorage
		localStorageMock = {};
		Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] || null);
		Storage.prototype.setItem = vi.fn((key: string, value: string) => {
			localStorageMock[key] = value;
		});
		Storage.prototype.removeItem = vi.fn((key: string) => {
			delete localStorageMock[key];
		});

		// Reset mocks
		vi.clearAllMocks();
	});

	describe('Token Management', () => {
		const TOKEN_KEY = 'uneventful_session_token';
		const mockToken = 'test-token-123';

		it('should save token to localStorage', () => {
			setAuthToken(mockToken);

			expect(localStorage.setItem).toHaveBeenCalledWith(TOKEN_KEY, mockToken);
			expect(localStorageMock[TOKEN_KEY]).toBe(mockToken);
		});

		it('should retrieve token from localStorage', () => {
			localStorageMock[TOKEN_KEY] = mockToken;

			const token = getAuthToken();

			expect(localStorage.getItem).toHaveBeenCalledWith(TOKEN_KEY);
			expect(token).toBe(mockToken);
		});

		it('should return null when no token exists', () => {
			const token = getAuthToken();

			expect(token).toBeNull();
		});

		it('should remove token from localStorage', () => {
			localStorageMock[TOKEN_KEY] = mockToken;

			removeAuthToken();

			expect(localStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
			expect(localStorageMock[TOKEN_KEY]).toBeUndefined();
		});

		it('should return true when authenticated', () => {
			localStorageMock[TOKEN_KEY] = mockToken;

			expect(isAuthenticated()).toBe(true);
		});

		it('should return false when not authenticated', () => {
			expect(isAuthenticated()).toBe(false);
		});

		it('should return false when token is empty string', () => {
			localStorageMock[TOKEN_KEY] = '';

			expect(isAuthenticated()).toBe(false);
		});
	});

	describe('requestMagicLink', () => {
		it('should POST to /api/auth/request with phone', async () => {
			const mockResponse = { success: true, requiresRegistration: false };
			fetchMock.mockResolvedValue({
				json: async () => mockResponse,
			});

			const result = await requestMagicLink('+15555551234');

			expect(fetchMock).toHaveBeenCalledWith(
				'http://localhost:2999/api/auth/request',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ phone: '+15555551234' }),
				}),
			);
			expect(result).toEqual(mockResponse);
		});

		it('should return requiresRegistration: true for new user', async () => {
			fetchMock.mockResolvedValue({
				json: async () => ({ success: true, requiresRegistration: true }),
			});

			const result = await requestMagicLink('+15555559999');

			expect(result.requiresRegistration).toBe(true);
		});

		it('should return requiresRegistration: false for existing user', async () => {
			fetchMock.mockResolvedValue({
				json: async () => ({ success: true, requiresRegistration: false }),
			});

			const result = await requestMagicLink('+15555551234');

			expect(result.requiresRegistration).toBe(false);
		});
	});

	describe('registerUser', () => {
		it('should POST to /api/auth/register with phone and name', async () => {
			const mockResponse = { success: true, message: 'Account created' };
			fetchMock.mockResolvedValue({
				json: async () => mockResponse,
			});

			const result = await registerUser('+15555551234', 'Test User');

			expect(fetchMock).toHaveBeenCalledWith(
				'http://localhost:2999/api/auth/register',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ phone: '+15555551234', name: 'Test User' }),
				}),
			);
			expect(result).toEqual(mockResponse);
		});

		it('should return success response after registration', async () => {
			fetchMock.mockResolvedValue({
				json: async () => ({ success: true, message: 'Account created!' }),
			});

			const result = await registerUser('+15555559999', 'New User');

			expect(result.success).toBe(true);
		});
	});

	describe('verifyMagicLink', () => {
		it('should GET /api/auth/verify with token', async () => {
			const mockToken = 'magic-link-token';
			const mockResponse = {
				success: true,
				sessionToken: 'session-token-123',
				user: { id: '1', name: 'Test User', phone: '+15555551234' },
			};
			fetchMock.mockResolvedValue({
				json: async () => mockResponse,
			});

			const result = await verifyMagicLink(mockToken);

			expect(fetchMock).toHaveBeenCalledWith(`http://localhost:2999/api/auth/verify?token=${mockToken}`);
			expect(result).toEqual(mockResponse);
		});

		it('should return session token and user data', async () => {
			const mockUser = { id: '1', name: 'Test', phone: '+15555551234' };
			fetchMock.mockResolvedValue({
				json: async () => ({
					success: true,
					sessionToken: 'new-session-token',
					user: mockUser,
				}),
			});

			const result = await verifyMagicLink('token');

			expect(result.sessionToken).toBe('new-session-token');
			expect(result.user).toEqual(mockUser);
		});
	});

	describe('getCurrentUser', () => {
		it('should GET /api/auth/me with Authorization header', async () => {
			const mockToken = 'session-token-123';
			localStorageMock['uneventful_session_token'] = mockToken;

			const mockUser = { id: '1', name: 'Test User', phone: '+15555551234' };
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => mockUser,
			});

			const result = await getCurrentUser();

			expect(fetchMock).toHaveBeenCalledWith(
				'http://localhost:2999/api/auth/me',
				expect.objectContaining({
					headers: {
						Authorization: `Bearer ${mockToken}`,
					},
				}),
			);
			expect(result).toEqual(mockUser);
		});

		it('should return null when no token exists', async () => {
			const result = await getCurrentUser();

			expect(result).toBeNull();
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('should remove token and return null on 401 response', async () => {
			localStorageMock['uneventful_session_token'] = 'expired-token';

			fetchMock.mockResolvedValue({
				ok: false,
				status: 401,
			});

			const result = await getCurrentUser();

			expect(localStorage.removeItem).toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it('should remove token and return null on 403 response', async () => {
			localStorageMock['uneventful_session_token'] = 'invalid-token';

			fetchMock.mockResolvedValue({
				ok: false,
				status: 403,
			});

			const result = await getCurrentUser();

			expect(localStorage.removeItem).toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it('should remove token and return null on network error', async () => {
			localStorageMock['uneventful_session_token'] = 'token';

			fetchMock.mockRejectedValue(new Error('Network error'));

			const result = await getCurrentUser();

			expect(localStorage.removeItem).toHaveBeenCalled();
			expect(result).toBeNull();
		});
	});

	describe('logout', () => {
		it('should remove token and redirect to /login', () => {
			localStorageMock['uneventful_session_token'] = 'token';
			delete window.location;
			(window as any).location = { href: '' };

			logout();

			expect(localStorage.removeItem).toHaveBeenCalledWith('uneventful_session_token');
			expect(window.location.href).toBe('/login');
		});

		it('should redirect even if no token exists', () => {
			delete window.location;
			(window as any).location = { href: '' };

			logout();

			expect(window.location.href).toBe('/login');
		});
	});
});
