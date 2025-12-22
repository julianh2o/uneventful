import { getApiBaseUrl } from '../utils/api';

const TOKEN_KEY = 'uneventful_session_token';

export interface AuthUser {
	id: string;
	firstName: string;
	lastName: string;
	phone: string;
}

export interface AuthRequestResponse {
	success: boolean;
	requiresRegistration?: boolean;
	message: string;
	error?: string;
}

export interface AuthVerifyResponse {
	success: boolean;
	sessionToken?: string;
	user?: AuthUser;
	error?: string;
}

export interface RegisterResponse {
	success: boolean;
	message: string;
	error?: string;
}

export const setAuthToken = (token: string): void => {
	localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
	return localStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = (): void => {
	localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
	return !!getAuthToken();
};

export const requestMagicLink = async (phone: string): Promise<AuthRequestResponse> => {
	const response = await fetch(`${getApiBaseUrl()}/api/auth/request`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ phone }),
	});

	return response.json();
};

export const registerUser = async (phone: string, firstName: string, lastName: string): Promise<RegisterResponse> => {
	const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ phone, firstName, lastName }),
	});

	return response.json();
};

export const verifyMagicLink = async (token: string): Promise<AuthVerifyResponse> => {
	const response = await fetch(`${getApiBaseUrl()}/api/auth/verify?token=${token}`);
	return response.json();
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
	const token = getAuthToken();

	if (!token) {
		return null;
	}

	try {
		const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			removeAuthToken();
			return null;
		}

		return response.json();
	} catch (error) {
		console.error('Failed to get current user:', error);
		removeAuthToken();
		return null;
	}
};

export const logout = (): void => {
	removeAuthToken();
	window.location.href = '/login';
};
