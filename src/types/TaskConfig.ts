import { Condition } from './Condition';

export interface Subtask {
	id?: string;
	name: string;
	description?: string;
	subtasks?: SubtaskItem[];
	condition?: Condition;
}

// Subtask can be either a string (legacy) or an object (new format)
export type SubtaskItem = string | Subtask;

export interface Task {
	id: string;
	name: string;
	summary?: string;
	description: string;
	deadline: number;
	subtasks?: SubtaskItem[];
	condition?: Condition;
}

export interface TasksConfig {
	tasks: Task[];
}
