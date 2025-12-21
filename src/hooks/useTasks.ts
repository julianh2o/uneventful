import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/api';

export interface Task {
	id: string;
	name: string;
	summary?: string;
	description: string;
	deadline: number;
	subtasks?: string[];
}

interface UseTasksResult {
	tasks: Task[];
	loading: boolean;
}

export const useTasks = (): UseTasksResult => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTasks = async () => {
			try {
				const response = await fetch(`${getApiBaseUrl()}/api/tasks`);
				if (response.ok) {
					const data = await response.json();
					setTasks(data.tasks || []);
				}
			} catch {
				// Tasks are optional, don't show error
			} finally {
				setLoading(false);
			}
		};

		fetchTasks();
	}, []);

	return { tasks, loading };
};
