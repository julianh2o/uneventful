import { getApiBaseUrl } from './api';

export type ErrorType = 'runtime' | 'react' | 'api';

export interface ErrorReport {
	message: string;
	stack?: string;
	url: string;
	timestamp: string;
	type: ErrorType;
	componentStack?: string;
}

export const reportError = async (error: Error | string, type: ErrorType, componentStack?: string): Promise<void> => {
	try {
		const errorReport: ErrorReport = {
			message: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
			url: window.location.href,
			timestamp: new Date().toISOString(),
			type,
			componentStack,
		};

		await fetch(`${getApiBaseUrl()}/api/errors`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(errorReport),
		});
	} catch {
		console.warn('Failed to report error to server');
	}
};
