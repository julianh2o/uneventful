import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, CircularProgress, Alert, Typography, Paper, Chip, IconButton, Button, Collapse } from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	ArrowBack as ArrowBackIcon,
	Assignment as TaskIcon,
	CalendarToday as CalendarIcon,
	ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

import { APP_TITLE } from '../utils/constants';
import { useTask } from '../hooks/useTask';
import { SubtaskList } from '../components/SubtaskList';
import { countAllSubtasks, collectAllSubtaskKeys } from '../utils/taskHelpers';

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

interface TaskDetailProps {
	eventId?: string;
	taskId?: string;
	defaultExpanded?: boolean;
}

export const TaskDetail = ({
	eventId: eventIdProp,
	taskId: taskIdProp,
	defaultExpanded = true,
}: TaskDetailProps = {}) => {
	const { id: eventIdParam, taskId: taskIdParam } = useParams<{ id: string; taskId: string }>();
	const navigate = useNavigate();
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	// Use props if provided, otherwise fall back to URL params
	const eventId = eventIdProp || eventIdParam;
	const taskId = taskIdProp || taskIdParam;

	// Use custom hook for data fetching and state management
	const { event, task, loading, error, completedTasks, toggleTask, toggleSubtask } = useTask(
		eventId || '',
		taskId || '',
	);

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
	// Task is complete if explicitly marked OR all subtasks are complete
	const allSubtasksComplete = totalSubtasks > 0 && completedCount === totalSubtasks;
	const isCompleted = completedTasks.has(task.name) || allSubtasksComplete;
	const overdue = isTaskOverdue(task.deadline) && !isCompleted;

	// Determine if this is being used as a standalone page or embedded component
	const isStandalonePage = !eventIdProp && !taskIdProp;

	const content = (
		<Paper sx={{ mb: 3, overflow: 'hidden' }}>
			{/* Header Section - Collapsible */}
			<Box
				sx={{
					p: 4,
					background: isCompleted
						? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)'
						: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
					color: 'white',
					cursor: 'pointer',
					position: 'relative',
				}}
				onClick={() => setIsExpanded(!isExpanded)}>
				{/* Expand/Collapse Icon */}
				<IconButton
					sx={{
						position: 'absolute',
						top: 16,
						right: 16,
						color: 'white',
						transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.3s',
					}}>
					<ExpandMoreIcon />
				</IconButton>

				<Box sx={{ mb: 2, pr: 6 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: task.summary ? 1 : 0 }}>
						<TaskIcon sx={{ fontSize: 40 }} />
						<Typography variant='h5' fontWeight='bold'>
							{task.name}
						</Typography>
					</Box>
					{task.summary && (
						<Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.85)', ml: 7 }}>
							{task.summary}
						</Typography>
					)}
				</Box>

				{/* Chips */}
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
						<Box
							sx={{
								position: 'relative',
								height: 32,
								px: 1.5,
								borderRadius: '16px',
								border: '1px solid rgba(255,255,255,0.3)',
								overflow: 'hidden',
								display: 'flex',
								alignItems: 'center',
								gap: 0.75,
							}}>
							{/* Green fill background */}
							<Box
								sx={{
									position: 'absolute',
									left: 0,
									top: 0,
									bottom: 0,
									width: `${progress}%`,
									bgcolor: 'rgba(76, 175, 80, 0.5)',
									borderRadius: '16px',
									transition: 'width 0.3s ease',
								}}
							/>
							{/* Icon and text */}
							{isCompleted && (
								<CheckCircleIcon sx={{ fontSize: 18, color: 'white', position: 'relative', zIndex: 1 }} />
							)}
							<Typography
								variant='body2'
								sx={{
									color: 'white',
									position: 'relative',
									zIndex: 1,
									fontSize: '0.8125rem',
									fontWeight: 500,
								}}>
								{isCompleted ? 'Completed' : `${Math.round(progress)}% complete`}
							</Typography>
						</Box>
					)}
				</Box>
			</Box>

			{/* Collapsible Content Section (Description + Subtasks) */}
			<Collapse in={isExpanded}>
				<Box sx={{ pt: 2, px: 4, pb: 4, bgcolor: 'background.paper' }}>
					{/* Description */}
					<Box
						sx={{
							mb: task.subtasks && task.subtasks.length > 0 ? 3 : 0,
							'& p': { margin: '0.5em 0' },
							'& ul, & ol': { margin: '0.5em 0', paddingLeft: '1.5em' },
							'& a': { color: 'primary.main', textDecoration: 'underline' },
							'& strong': { fontWeight: 'bold' },
						}}>
						<ReactMarkdown>{task.description}</ReactMarkdown>
					</Box>

					{/* Subtasks */}
					{task.subtasks && task.subtasks.length > 0 && (
						<Box>
							<Typography variant='h6' gutterBottom>
								Subtasks
							</Typography>
							<SubtaskList
								taskName={task.name}
								subtasks={task.subtasks}
								eventData={event.data}
								completedSubtasks={completedTasks}
								onToggle={toggleSubtask}
							/>
						</Box>
					)}
					<Box sx={{ textAlign: 'center', mt: 2 }}>
						<Button
							variant={isCompleted ? 'outlined' : 'contained'}
							color={isCompleted ? 'success' : 'primary'}
							size='large'
							startIcon={isCompleted ? <CheckCircleIcon /> : undefined}
							onClick={toggleTask}
							sx={{ minWidth: 200 }}>
							{isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
						</Button>
					</Box>
				</Box>
			</Collapse>
		</Paper>
	);

	// Wrap with page layout if standalone, otherwise return just the content
	if (isStandalonePage) {
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

					{content}

					{/* Event Context */}
					<Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
						Event: {event.data.eventName || 'Unnamed Event'} • {event.data.eventDate}
					</Typography>
				</Box>
			</>
		);
	}

	return content;
};
