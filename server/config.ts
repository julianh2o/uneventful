import 'dotenv/config';

interface Config {
	port: number;
	nodeEnv: 'development' | 'production' | 'test';
	isProduction: boolean;
	isDevelopment: boolean;
	isTest: boolean;
	database: {
		url: string;
	};
	twilio: {
		accountSid: string;
		authToken: string;
		phoneNumber: string;
	};
	auth: {
		jwtSecret: string;
		appBaseUrl: string;
	};
}

function getRequiredEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
	return process.env[key] || defaultValue;
}

function createConfig(): Config {
	const nodeEnv = (process.env.NODE_ENV || 'development') as Config['nodeEnv'];

	return {
		port: parseInt(getOptionalEnv('PORT', '2999'), 10),
		nodeEnv,
		isProduction: nodeEnv === 'production',
		isDevelopment: nodeEnv === 'development',
		isTest: nodeEnv === 'test',
		database: {
			url: getOptionalEnv('DATABASE_URL', 'file:./data/uneventful.db'),
		},
		twilio: {
			accountSid: getRequiredEnv('TWILIO_ACCOUNT_SID'),
			authToken: getRequiredEnv('TWILIO_AUTH_TOKEN'),
			phoneNumber: getRequiredEnv('TWILIO_PHONE_NUMBER'),
		},
		auth: {
			jwtSecret: getRequiredEnv('JWT_SECRET'),
			appBaseUrl: getOptionalEnv(
				'APP_BASE_URL',
				nodeEnv === 'production' ? '' : 'http://localhost:2998'
			),
		},
	};
}

// Create and export the config
export const config = createConfig();
