import { getApiBaseUrl } from './api';
import { getAuthToken } from '../services/authService';

interface FetchOptions {
	authenticated?: boolean;
	headers?: Record<string, string>;
	method?: string;
	body?: string;
	[key: string]: any;
}

export const apiClient = async (endpoint: string, options: FetchOptions = {}): Promise<Response> => {
	const { authenticated = true, headers = {}, ...restOptions } = options;

	const requestHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		...headers,
	};

	if (authenticated) {
		const token = getAuthToken();
		if (token) {
			requestHeaders['Authorization'] = `Bearer ${token}`;
		}
	}

	const url = `${getApiBaseUrl()}${endpoint}`;

	return fetch(url, {
		...restOptions,
		headers: requestHeaders,
	});
};
