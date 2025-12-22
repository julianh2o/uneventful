/**
 * Shared condition interface used by both forms and tasks
 */
export interface Condition {
	field: string;
	operator: 'in' | 'equals' | 'notEquals' | 'contains' | 'containsAny';
	values?: string[];
	value?: string;
}
