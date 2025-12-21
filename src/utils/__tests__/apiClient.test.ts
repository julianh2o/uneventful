import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../apiClient';

// Mock the dependencies
vi.mock('../api', () => ({
	getApiBaseUrl: () => 'http://localhost:2999',
}));

vi.mock('../../services/authService', () => ({
	getAuthToken: vi.fn(),
}));

import { getAuthToken } from '../../services/authService';

describe('apiClient', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Mock fetch
		fetchMock = vi.fn();
		global.fetch = fetchMock;

		// Reset mocks
		vi.clearAllMocks();
	});

	describe('Authenticated Requests', () => {
		it('should add Authorization header when token exists', async () => {
			const mockToken = 'test-token-123';
			vi.mocked(getAuthToken).mockReturnValue(mockToken);
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/test');

			expect(fetchMock).toHaveBeenCalledWith(
				'http://localhost:2999/api/test',
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockToken}`,
						'Content-Type': 'application/json',
					}),
				}),
			);
		});

		it('should add Content-Type: application/json by default', async () => {
			vi.mocked(getAuthToken).mockReturnValue('token');
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/test');

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
					}),
				}),
			);
		});

		it('should not add Authorization header when token is null', async () => {
			vi.mocked(getAuthToken).mockReturnValue(null);
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/test');

			expect(fetchMock).toHaveBeenCalledWith(
				'http://localhost:2999/api/test',
				expect.objectContaining({
					headers: expect.not.objectContaining({
						Authorization: expect.anything(),
					}),
				}),
			);
		});
	});

	describe('Unauthenticated Requests', () => {
		it('should omit Authorization header when authenticated: false', async () => {
			vi.mocked(getAuthToken).mockReturnValue('token');
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/test', { authenticated: false });

			expect(fetchMock).toHaveBeenCalledWith(
				'http://localhost:2999/api/test',
				expect.objectContaining({
					headers: expect.not.objectContaining({
						Authorization: expect.anything(),
					}),
				}),
			);
		});

		it('should still include Content-Type header', async () => {
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/test', { authenticated: false });

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
					}),
				}),
			);
		});
	});

	describe('URL Construction', () => {
		it('should combine base URL with endpoint', async () => {
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/events');

			expect(fetchMock).toHaveBeenCalledWith('http://localhost:2999/api/events', expect.any(Object));
		});

		it('should handle endpoints with query parameters', async () => {
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/events?id=123');

			expect(fetchMock).toHaveBeenCalledWith('http://localhost:2999/api/events?id=123', expect.any(Object));
		});

		it('should handle endpoints without leading slash', async () => {
			fetchMock.mockResolvedValue(new Response());

			await apiClient('api/events');

			expect(fetchMock).toHaveBeenCalledWith('http://localhost:2999api/events', expect.any(Object));
		});
	});

	describe('Request Options', () => {
		it('should pass through method option', async () => {
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/events', { method: 'POST' });

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: 'POST',
				}),
			);
		});

		it('should pass through body option', async () => {
			fetchMock.mockResolvedValue(new Response());
			const body = JSON.stringify({ name: 'Test' });

			await apiClient('/api/events', { method: 'POST', body });

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body,
				}),
			);
		});

		it('should merge custom headers with default headers', async () => {
			vi.mocked(getAuthToken).mockReturnValue('token');
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/test', {
				headers: { 'X-Custom-Header': 'custom-value' },
			});

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						Authorization: 'Bearer token',
						'X-Custom-Header': 'custom-value',
					}),
				}),
			);
		});

		it('should allow overriding Content-Type header', async () => {
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/test', {
				authenticated: false,
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'multipart/form-data',
					}),
				}),
			);
		});

		it('should pass through any additional fetch options', async () => {
			fetchMock.mockResolvedValue(new Response());

			await apiClient('/api/test', {
				authenticated: false,
				mode: 'cors',
				credentials: 'include',
			});

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					mode: 'cors',
					credentials: 'include',
				}),
			);
		});
	});

	describe('Response Handling', () => {
		it('should return the fetch response', async () => {
			const mockResponse = new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
			fetchMock.mockResolvedValue(mockResponse);

			const result = await apiClient('/api/test', { authenticated: false });

			expect(result).toBe(mockResponse);
		});

		it('should propagate fetch errors', async () => {
			const error = new Error('Network error');
			fetchMock.mockRejectedValue(error);

			await expect(apiClient('/api/test', { authenticated: false })).rejects.toThrow('Network error');
		});
	});
});
