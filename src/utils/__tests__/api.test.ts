import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getApiBaseUrl } from '../api';

describe('getApiBaseUrl', () => {
	let originalLocation: Location;

	beforeEach(() => {
		// Save original location
		originalLocation = window.location;
	});

	afterEach(() => {
		// Restore original location
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true,
		});
	});

	it('should return port 2999 for localhost', () => {
		Object.defineProperty(window, 'location', {
			value: {
				hostname: 'localhost',
				port: '2998',
				protocol: 'http:',
			},
			writable: true,
		});

		const result = getApiBaseUrl();
		expect(result).toBe('http://localhost:2999');
	});

	it('should return port 2999 for 127.0.0.1', () => {
		Object.defineProperty(window, 'location', {
			value: {
				hostname: '127.0.0.1',
				port: '2998',
				protocol: 'http:',
			},
			writable: true,
		});

		const result = getApiBaseUrl();
		expect(result).toBe('http://127.0.0.1:2999');
	});

	it('should return same origin for production domain', () => {
		Object.defineProperty(window, 'location', {
			value: {
				hostname: 'uneventful.bawdyshop.space',
				port: '',
				protocol: 'https:',
				origin: 'https://uneventful.bawdyshop.space',
			},
			writable: true,
		});

		const result = getApiBaseUrl();
		expect(result).toBe('https://uneventful.bawdyshop.space');
	});

	it('should return same origin for any non-localhost domain', () => {
		Object.defineProperty(window, 'location', {
			value: {
				hostname: 'example.com',
				port: '',
				protocol: 'https:',
				origin: 'https://example.com',
			},
			writable: true,
		});

		const result = getApiBaseUrl();
		expect(result).toBe('https://example.com');
	});

	it('should handle production domain with custom port', () => {
		Object.defineProperty(window, 'location', {
			value: {
				hostname: 'myapp.com',
				port: '8080',
				protocol: 'https:',
				origin: 'https://myapp.com:8080',
			},
			writable: true,
		});

		const result = getApiBaseUrl();
		expect(result).toBe('https://myapp.com:8080');
	});
});
