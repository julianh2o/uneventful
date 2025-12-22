import { Condition } from '../types/Condition';

/**
 * Helper to parse array values which may be stored as JSON strings
 * (e.g., checkboxGroup values are stored as JSON strings)
 */
const parseArrayValue = (val: unknown): string[] => {
	if (!val) return [];
	if (Array.isArray(val)) return val.map(String);
	if (typeof val === 'string') {
		try {
			const parsed = JSON.parse(val);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
};

/**
 * Evaluates a condition against data
 * Used by both tasks and forms for consistent condition evaluation
 */
export const evaluateCondition = (condition: Condition | undefined, data: Record<string, unknown>): boolean => {
	if (!condition) return true;

	const fieldValue = data[condition.field];

	switch (condition.operator) {
		case 'equals':
			return fieldValue === condition.value;

		case 'notEquals':
			return fieldValue !== condition.value;

		case 'in':
			if (!condition.values) return false;
			return condition.values.includes(String(fieldValue));

		case 'contains': {
			// Handle both array values (including JSON strings) and string values
			const arrayValue = parseArrayValue(fieldValue);
			if (arrayValue.length > 0) {
				return condition.value ? arrayValue.includes(condition.value) : false;
			}
			// Fallback for plain string values
			if (typeof fieldValue === 'string') {
				return condition.value ? fieldValue.includes(condition.value) : false;
			}
			return false;
		}

		case 'containsAny': {
			if (!condition.values) return false;
			// Handle array values (including JSON strings)
			const arrayValue = parseArrayValue(fieldValue);
			return arrayValue.length > 0 && condition.values.some((val) => arrayValue.includes(val));
		}

		default:
			return true;
	}
};
