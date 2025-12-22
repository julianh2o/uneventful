import { SubtaskItem, Subtask } from '../types/TaskConfig';
import { evaluateCondition } from './taskConditions';

/**
 * Checks if a subtask item is a Subtask object (vs legacy string)
 */
export const isSubtaskObject = (subtask: SubtaskItem): subtask is Subtask => {
	return typeof subtask === 'object' && subtask !== null && 'name' in subtask;
};

/**
 * Gets the display name for a subtask (string or object)
 */
export const getSubtaskName = (subtask: SubtaskItem): string => {
	return isSubtaskObject(subtask) ? subtask.name : subtask;
};

/**
 * Generates a unique key for a subtask at any nesting level
 */
export const getSubtaskKey = (taskName: string, subtaskPath: string[]): string => {
	return `${taskName}::${subtaskPath.join('::')}`;
};

/**
 * Recursively counts all subtasks (including nested ones) that match conditions
 */
export const countAllSubtasks = (
	subtasks: SubtaskItem[] | undefined,
	eventData: Record<string, unknown>,
	depth = 0,
): number => {
	if (!subtasks || subtasks.length === 0) return 0;

	return subtasks.reduce((count, subtask) => {
		if (isSubtaskObject(subtask)) {
			// Check condition
			if (!evaluateCondition(subtask.condition, eventData)) {
				return count;
			}
			// Count this subtask + any nested subtasks
			return count + 1 + countAllSubtasks(subtask.subtasks, eventData, depth + 1);
		}
		// Legacy string subtask
		return count + 1;
	}, 0);
};

/**
 * Recursively collects all subtask keys (including nested ones) that match conditions
 */
export const collectAllSubtaskKeys = (
	taskName: string,
	subtasks: SubtaskItem[] | undefined,
	eventData: Record<string, unknown>,
	pathPrefix: string[] = [],
): string[] => {
	if (!subtasks || subtasks.length === 0) return [];

	const keys: string[] = [];

	subtasks.forEach((subtask) => {
		const subtaskName = getSubtaskName(subtask);
		const currentPath = [...pathPrefix, subtaskName];

		if (isSubtaskObject(subtask)) {
			// Check condition
			if (!evaluateCondition(subtask.condition, eventData)) {
				return;
			}
			// Add this subtask key
			keys.push(getSubtaskKey(taskName, currentPath));

			// Recursively collect nested subtask keys
			if (subtask.subtasks) {
				keys.push(...collectAllSubtaskKeys(taskName, subtask.subtasks, eventData, currentPath));
			}
		} else {
			// Legacy string subtask
			keys.push(getSubtaskKey(taskName, currentPath));
		}
	});

	return keys;
};

/**
 * Checks if all subtasks (including nested ones) are completed
 */
export const areAllSubtasksCompleted = (
	taskName: string,
	subtasks: SubtaskItem[] | undefined,
	eventData: Record<string, unknown>,
	completedTasks: Set<string>,
): boolean => {
	if (!subtasks || subtasks.length === 0) {
		return completedTasks.has(taskName);
	}

	const allKeys = collectAllSubtaskKeys(taskName, subtasks, eventData);
	return allKeys.length > 0 && allKeys.every((key) => completedTasks.has(key));
};
