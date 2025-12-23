import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';
import { reportError } from '../utils/errorReporter';
import { Task } from '../types/TaskConfig';
import { Event } from './useEvent';
import { getSubtaskKey, collectAllSubtaskKeys } from '../utils/taskHelpers';

interface UseTaskResult {
	event: Event | null;
	task: Task | null;
	loading: boolean;
	error: string | null;
	completedTasks: Set<string>;
	toggleTask: () => Promise<void>;
	toggleSubtask: (subtaskPath: string[]) => Promise<void>;
}

export const useTask = (eventId: string, taskId: string): UseTaskResult => {
	const [event, setEvent] = useState<Event | null>(null);
	const [task, setTask] = useState<Task | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [eventRes, tasksRes] = await Promise.all([
					apiClient(`/api/events/${eventId}`),
					apiClient('/api/tasks', { authenticated: false }),
				]);

				if (!eventRes.ok) {
					throw new Error('Event not found');
				}

				const eventData = await eventRes.json();
				setEvent(eventData);
				setCompletedTasks(new Set(eventData.completedTasks || []));

				if (tasksRes.ok) {
					const tasksData = await tasksRes.json();
					const foundTask = tasksData.tasks?.find((t: Task) => t.id === taskId);
					if (!foundTask) {
						throw new Error('Task not found');
					}
					setTask(foundTask);
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'An error occurred';
				setError(errorMessage);
				reportError(err instanceof Error ? err : new Error(errorMessage), 'api');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [eventId, taskId]);

	// Update completedTasks when event data changes
	useEffect(() => {
		if (event?.completedTasks) {
			setCompletedTasks(new Set(event.completedTasks));
		}
	}, [event?.completedTasks]);

	const toggleTask = useCallback(async () => {
		if (!task) return;

		const next = new Set(completedTasks);
		if (next.has(task.name)) {
			next.delete(task.name);
		} else {
			next.add(task.name);
		}
		setCompletedTasks(next);

		try {
			await apiClient(`/api/events/${eventId}/tasks`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ completedTasks: Array.from(next) }),
			});
		} catch {
			setCompletedTasks(completedTasks);
		}
	}, [task, completedTasks, eventId]);

	const toggleSubtask = useCallback(
		async (subtaskPath: string[]) => {
			if (!task || !event) return;

			const subtaskKey = getSubtaskKey(task.name, subtaskPath);
			const next = new Set(completedTasks);
			if (next.has(subtaskKey)) {
				next.delete(subtaskKey);
			} else {
				next.add(subtaskKey);
			}

			// Check if all subtasks are now complete
			const allSubtaskKeys = collectAllSubtaskKeys(task.name, task.subtasks, event.data);
			const allComplete = allSubtaskKeys.every((key) => next.has(key));

			// If all subtasks are complete, also mark the task as complete
			if (allComplete && !next.has(task.name)) {
				next.add(task.name);
			}

			setCompletedTasks(next);

			try {
				await apiClient(`/api/events/${eventId}/tasks`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ completedTasks: Array.from(next) }),
				});
			} catch {
				setCompletedTasks(completedTasks);
			}
		},
		[task, event, completedTasks, eventId],
	);

	return {
		event,
		task,
		loading,
		error,
		completedTasks,
		toggleTask,
		toggleSubtask,
	};
};
