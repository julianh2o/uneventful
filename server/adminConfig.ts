import fs from 'fs';
import YAML from 'yaml';
import { getAdminsConfigPath } from './utils/paths';

const ADMINS_FILE = getAdminsConfigPath();

interface AdminConfig {
	admins: Array<{ phone: string }>;
}

let cachedAdmins: Set<string> | null = null;
let lastModified: number | null = null;

const loadAdminConfig = (): Set<string> => {
	try {
		if (!fs.existsSync(ADMINS_FILE)) {
			return new Set();
		}

		const stats = fs.statSync(ADMINS_FILE);
		const currentModified = stats.mtimeMs;

		// Return cached version if file hasn't changed
		if (cachedAdmins && lastModified === currentModified) {
			return cachedAdmins;
		}

		const content = fs.readFileSync(ADMINS_FILE, 'utf8');
		const config: AdminConfig = YAML.parse(content);

		cachedAdmins = new Set(config.admins?.map((a) => a.phone) || []);
		lastModified = currentModified;

		return cachedAdmins;
	} catch (error) {
		console.error('Error loading admin config:', error);
		return new Set();
	}
};

export const isAdmin = (phone: string): boolean => {
	const admins = loadAdminConfig();
	return admins.has(phone);
};
