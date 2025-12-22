import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
	Box,
	CircularProgress,
	Alert,
	Typography,
	Paper,
	Chip,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Checkbox,
	IconButton,
	LinearProgress,
	Button,
} from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	RadioButtonUnchecked as UncheckedIcon,
	ArrowBack as ArrowBackIcon,
	Assignment as TaskIcon,
	CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

import { APP_TITLE } from '../utils/constants';
import { apiClient } from '../utils/apiClient';
import { reportError } from '../utils/errorReporter';
import { Task, Subtask, SubtaskItem } from '../types/TaskConfig';
import { evaluateCondition } from '../utils/taskConditions';
import {
	isSubtaskObject,
	getSubtaskName,
	getSubtaskKey,
	countAllSubtasks,
	collectAllSubtaskKeys,
} from '../utils/taskHelpers';

interface EventData {
	eventName?: string;
	eventDate?: string;
	eventTime?: string;
	[key: string]: unknown;
}

interface Event {
	id: string;
	data: EventData;
	completedTasks?: string[];
}

const parseEventDate = (dateStr?: string, timeStr?: string): Date | null => {
	if (!dateStr) return null;
	try {
		const [month, day, year] = dateStr.split('/').map(Number);
		let hours = 0;
		let minutes = 0;
		if (timeStr) {
			const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
			if (match) {
				hours = parseInt(match[1], 10);
				minutes = parseInt(match[2], 10);
				if (match[3]?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
				if (match[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0;
			}
		}
		return new Date(year, month - 1, day, hours, minutes);
	} catch {
		return null;
	}
};

/**
 * Recursive component for rendering subtasks with nesting support
 */
interface RecursiveSubtaskListProps {
	taskName: string;
	subtasks: SubtaskItem[];
	eventData: EventData;
	completedTasks: Set<string>;
	onToggle: (subtaskPath: string[]) => void;
	pathPrefix?: string[];
	depth?: number;
}

const RecursiveSubtaskList: React.FC<RecursiveSubtaskListProps> = ({
	taskName,
	subtasks,
	eventData,
	completedTasks,
	onToggle,
	pathPrefix = [],
	depth = 0,
}) => {
	// Filter subtasks based on conditions
	const visibleSubtasks = subtasks.filter((subtask) => {
		if (isSubtaskObject(subtask)) {
			return evaluateCondition(subtask.condition, eventData);
		}
		return true;
	});

	return (
		<List sx={{ pl: depth * 2 }}>
			{visibleSubtasks.map((subtask, index) => {
				const subtaskName = getSubtaskName(subtask);
				const currentPath = [...pathPrefix, subtaskName];
				const subtaskKey = getSubtaskKey(taskName, currentPath);
				const isSubtaskCompleted = completedTasks.has(subtaskKey);
				const hasNestedSubtasks = isSubtaskObject(subtask) && subtask.subtasks && subtask.subtasks.length > 0;

				return (
					<React.Fragment key={subtaskKey}>
						<ListItem
							sx={{
								py: 1,
								borderBottom: index < visibleSubtasks.length - 1 || hasNestedSubtasks ? '1px solid' : 'none',
								borderColor: 'divider',
							}}>
							<ListItemIcon>
								<Checkbox
									edge='start'
									checked={isSubtaskCompleted}
									onChange={() => onToggle(currentPath)}
									icon={<UncheckedIcon />}
									checkedIcon={<CheckCircleIcon color='success' />}
								/>
							</ListItemIcon>
							<ListItemText
								primary={
									<Typography
										variant='body1'
										sx={{
											textDecoration: isSubtaskCompleted ? 'line-through' : 'none',
											color: isSubtaskCompleted ? 'text.secondary' : 'text.primary',
											fontWeight: depth === 0 ? 500 : 400,
										}}>
										{subtaskName}
									</Typography>
								}
								secondary={
									isSubtaskObject(subtask) && subtask.description ? (
										<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
											{subtask.description}
										</Typography>
									) : null
								}
							/>
						</ListItem>

						{/* Recursively render nested subtasks */}
						{hasNestedSubtasks && isSubtaskObject(subtask) && (
							<Box sx={{ ml: 2 }}>
								<RecursiveSubtaskList
									taskName={taskName}
									subtasks={subtask.subtasks!}
									eventData={eventData}
									completedTasks={completedTasks}
									onToggle={onToggle}
									pathPrefix={currentPath}
									depth={depth + 1}
								/>
							</Box>
						)}
					</React.Fragment>
				);
			})}
		</List>
	);
};

export const TaskDetail = () => {
	const { id: eventId, taskId } = useParams<{ id: string; taskId: string }>();
	const navigate = useNavigate();
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

	const toggleTask = async () => {
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
	};

	const toggleSubtask = async (subtaskPath: string[]) => {
		if (!task) return;

		const subtaskKey = getSubtaskKey(task.name, subtaskPath);
		const next = new Set(completedTasks);
		if (next.has(subtaskKey)) {
			next.delete(subtaskKey);
		} else {
			next.add(subtaskKey);
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
	};

	const getTaskDueDate = (deadline: number): Date | null => {
		if (!event) return null;
		const eventDate = parseEventDate(event.data.eventDate, event.data.eventTime);
		if (!eventDate) return null;
		const dueDate = new Date(eventDate);
		dueDate.setDate(dueDate.getDate() - deadline);
		return dueDate;
	};

	const isTaskOverdue = (deadline: number): boolean => {
		const dueDate = getTaskDueDate(deadline);
		if (!dueDate) return false;
		return new Date() > dueDate;
	};

	const formatDueDate = (deadline: number): string => {
		const dueDate = getTaskDueDate(deadline);
		if (!dueDate) return '';
		return dueDate.toLocaleDateString();
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ m: 2 }}>
				<Alert severity='error'>{error}</Alert>
			</Box>
		);
	}

	if (!event || !task) {
		return (
			<Box sx={{ m: 2 }}>
				<Alert severity='warning'>Task not found</Alert>
			</Box>
		);
	}

	// Calculate progress using recursive subtask counting
	const allSubtaskKeys = collectAllSubtaskKeys(task.name, task.subtasks, event.data);
	const completedCount = allSubtaskKeys.filter((key) => completedTasks.has(key)).length;
	const totalSubtasks = countAllSubtasks(task.subtasks, event.data);
	const progress = totalSubtasks > 0 ? (completedCount / totalSubtasks) * 100 : 0;
	const isCompleted = totalSubtasks > 0 ? completedCount === totalSubtasks : completedTasks.has(task.name);
	const overdue = isTaskOverdue(task.deadline) && !isCompleted;

	return (
		<>
			<Helmet>
				<title>
					{task.name} | {event.data.eventName || 'Event'} | {APP_TITLE}
				</title>
			</Helmet>
			<Box sx={{ p: 3 }}>
				{/* Back Button */}
				<IconButton onClick={() => navigate(`/event/${eventId}`)} sx={{ mb: 2 }}>
					<ArrowBackIcon />
				</IconButton>

				{/* Task Header */}
				<Paper
					sx={{
						p: 4,
						mb: 3,
						background: isCompleted
							? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)'
							: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
						color: 'white',
					}}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
						<TaskIcon sx={{ fontSize: 40 }} />
						<Typography variant='h4' fontWeight='bold'>
							{task.name}
						</Typography>
					</Box>
					<Box
						sx={{
							mb: 3,
							opacity: 0.9,
							'& p': { margin: '0.5em 0' },
							'& ul, & ol': { margin: '0.5em 0', paddingLeft: '1.5em' },
							'& a': { color: 'inherit', textDecoration: 'underline' },
							'& strong': { fontWeight: 'bold' },
						}}>
						<ReactMarkdown>{task.description}</ReactMarkdown>
					</Box>
					<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
						<Chip
							icon={<CalendarIcon sx={{ color: 'white !important' }} />}
							label={`Due: ${formatDueDate(task.deadline)}`}
							sx={{
								bgcolor: overdue ? 'error.main' : 'rgba(255,255,255,0.2)',
								color: 'white',
							}}
						/>
						{totalSubtasks > 0 && (
							<Chip
								label={`${completedCount}/${totalSubtasks} subtasks`}
								sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
							/>
						)}
						{isCompleted && totalSubtasks > 0 && (
							<Chip
								icon={<CheckCircleIcon sx={{ color: 'white !important' }} />}
								label='Completed'
								sx={{ bgcolor: 'success.dark', color: 'white' }}
							/>
						)}
					</Box>
				</Paper>

				{/* Progress */}
				{totalSubtasks > 0 && (
					<Paper sx={{ p: 3, mb: 3 }}>
						<Typography variant='h6' gutterBottom>
							Progress
						</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
							<Box sx={{ flexGrow: 1 }}>
								<LinearProgress
									variant='determinate'
									value={progress}
									sx={{ height: 10, borderRadius: 5 }}
									color={isCompleted ? 'success' : 'primary'}
								/>
							</Box>
							<Typography variant='body2' color='text.secondary'>
								{Math.round(progress)}%
							</Typography>
						</Box>
					</Paper>
				)}

				{/* Subtasks */}
				{task.subtasks && task.subtasks.length > 0 ? (
					<Paper sx={{ p: 2 }}>
						<Typography variant='h6' gutterBottom>
							Subtasks
						</Typography>
						<RecursiveSubtaskList
							taskName={task.name}
							subtasks={task.subtasks}
							eventData={event.data}
							completedTasks={completedTasks}
							onToggle={toggleSubtask}
						/>
					</Paper>
				) : (
					<Paper sx={{ p: 3, textAlign: 'center' }}>
						<Button
							variant={isCompleted ? 'outlined' : 'contained'}
							color={isCompleted ? 'success' : 'primary'}
							size='large'
							startIcon={isCompleted ? <CheckCircleIcon /> : undefined}
							onClick={toggleTask}
							sx={{ minWidth: 200 }}>
							{isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
						</Button>
					</Paper>
				)}

				{/* Event Context */}
				<Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
					Event: {event.data.eventName || 'Unnamed Event'} • {event.data.eventDate}
				</Typography>
			</Box>
		</>
	);
};
