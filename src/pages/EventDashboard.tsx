import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
	Collapse,
	Button,
	IconButton,
} from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	RadioButtonUnchecked as UncheckedIcon,
	ChevronRight as ChevronRightIcon,
	Edit as EditIcon,
} from '@mui/icons-material';
import {
	Event as EventIcon,
	Person as PersonIcon,
	Groups as GroupsIcon,
	AccessTime as TimeIcon,
	CalendarToday as CalendarIcon,
	Email as ContactIcon,
	Notes as NotesIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

import { APP_TITLE } from '../utils/constants';
import { getApiBaseUrl } from '../utils/api';
import { useEvent } from '../hooks/useEvent';
import { useTasks, Task } from '../hooks/useTasks';
import { useEventCountdown } from '../hooks/useEventCountdown';
import { CatBat } from '../components/CatBat';

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

const CountdownDisplay = ({ days, hours }: { days: number; hours: number }) => {
	const isUnder24Hours = days === 0;
	const value = isUnder24Hours ? hours : days;
	const label = isUnder24Hours ? (hours === 1 ? 'hour' : 'hours') : days === 1 ? 'day' : 'days';

	return (
		<Paper
			elevation={3}
			sx={{
				p: 2,
				px: 4,
				display: 'inline-block',
				background: 'linear-gradient(145deg, #667eea 0%, #764ba2 100%)',
				color: 'white',
			}}>
			<Typography variant='h3' fontWeight='bold' component='span'>
				{value}
			</Typography>
			<Typography variant='h6' component='span' sx={{ ml: 1, opacity: 0.9 }}>
				{label}
			</Typography>
		</Paper>
	);
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
	<ListItem sx={{ py: 0.5 }}>
		<ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
		<ListItemText
			primary={
				<Box component='span'>
					<Typography component='span' color='text.secondary' variant='body2'>
						{label}:{' '}
					</Typography>
					<Typography component='span' variant='body2' fontWeight='medium'>
						{value}
					</Typography>
				</Box>
			}
		/>
	</ListItem>
);

export const EventDashboard = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	// Use custom hooks for data fetching
	const { event, loading, error } = useEvent(id || '');
	const { tasks } = useTasks();
	const countdown = useEventCountdown(event?.data.eventDate, event?.data.eventTime);

	// Local state for task management
	const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set(event?.completedTasks || []));
	const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

	// Update completedTasks when event data changes
	React.useEffect(() => {
		if (event?.completedTasks) {
			setCompletedTasks(new Set(event.completedTasks));
		}
	}, [event?.completedTasks]);

	if (!id) {
		return <Alert severity='error'>Event ID is missing</Alert>;
	}

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

	if (!event) {
		return (
			<Box sx={{ m: 2 }}>
				<Alert severity='warning'>Event not found</Alert>
			</Box>
		);
	}

	const { data } = event;

	const eventDate = parseEventDate(data.eventDate, data.eventTime);

	const getTaskDueDate = (deadline: number): Date | null => {
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

	const toggleTask = async (taskKey: string) => {
		const next = new Set(completedTasks);
		if (next.has(taskKey)) {
			next.delete(taskKey);
		} else {
			next.add(taskKey);
		}
		setCompletedTasks(next);

		try {
			await fetch(`${getApiBaseUrl()}/api/events/${id}/tasks`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ completedTasks: Array.from(next) }),
			});
		} catch {
			// Revert on error
			setCompletedTasks(completedTasks);
		}
	};

	const toggleExpanded = (taskName: string) => {
		const next = new Set(expandedTasks);
		if (next.has(taskName)) {
			next.delete(taskName);
		} else {
			next.add(taskName);
		}
		setExpandedTasks(next);
	};

	const getSubtaskKey = (taskName: string, subtask: string) => `${taskName}::${subtask}`;

	const areAllSubtasksCompleted = (task: Task): boolean => {
		if (!task.subtasks || task.subtasks.length === 0) return completedTasks.has(task.name);
		return task.subtasks.every((subtask) => completedTasks.has(getSubtaskKey(task.name, subtask)));
	};

	const getCompletedSubtaskCount = (task: Task): number => {
		if (!task.subtasks) return 0;
		return task.subtasks.filter((subtask) => completedTasks.has(getSubtaskKey(task.name, subtask))).length;
	};

	return (
		<>
			<Helmet>
				<title>
					{data.eventName || 'Event'} | {APP_TITLE}
				</title>
			</Helmet>
			<Box sx={{ p: 3 }}>
				{/* Header */}
				<Paper
					sx={{
						p: 4,
						mb: 3,
						background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
						color: 'white',
						textAlign: 'center',
						position: 'relative',
					}}>
					<Button
						variant='outlined'
						startIcon={<EditIcon />}
						onClick={() => navigate(`/event/${id}/edit`)}
						sx={{
							position: 'absolute',
							top: 16,
							right: 16,
							color: 'white',
							borderColor: 'rgba(255,255,255,0.5)',
							'&:hover': {
								borderColor: 'white',
								bgcolor: 'rgba(255,255,255,0.1)',
							},
						}}>
						Edit
					</Button>
					<EventIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
					<Typography variant='h3' fontWeight='bold' gutterBottom>
						{data.eventName || 'Unnamed Event'}
					</Typography>
					<Chip
						label={`Hosted by ${data.hostName || 'Unknown'}`}
						sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
						icon={<PersonIcon sx={{ color: 'white !important' }} />}
					/>
				</Paper>

				{/* Countdown */}
				<Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
					<Typography variant='h6' gutterBottom color='text.secondary'>
						{countdown.passed ? 'Event has started!' : 'Countdown to Event'}
					</Typography>
					{!countdown.passed && <CountdownDisplay days={countdown.days} hours={countdown.hours} />}
					{countdown.passed && <Chip label='Event is happening now or has passed' color='success' size='medium' />}
				</Paper>

				{/* Event Details */}
				<Paper sx={{ mb: 3 }}>
					<List dense>
						<InfoRow icon={<CalendarIcon color='primary' />} label='Date' value={data.eventDate || 'Not specified'} />
						<InfoRow icon={<TimeIcon color='secondary' />} label='Time' value={data.eventTime || 'Not specified'} />
						<InfoRow
							icon={<GroupsIcon color='success' />}
							label='Party Size'
							value={data.partySize || 'Not specified'}
						/>
						<InfoRow icon={<PersonIcon color='info' />} label='Host' value={data.hostName || 'Not specified'} />
						<InfoRow
							icon={<ContactIcon color='warning' />}
							label='Contact'
							value={data.hostContact || 'Not specified'}
						/>
						{data.specialRequests && (
							<InfoRow icon={<NotesIcon color='primary' />} label='Special Requests' value={data.specialRequests} />
						)}
					</List>
				</Paper>

				{/* Tasks Checklist */}
				{tasks.length > 0 && (
					<Paper sx={{ mb: 3, p: 2 }}>
						<Typography variant='h6' gutterBottom>
							Tasks
						</Typography>
						<List dense>
							{tasks.map((task) => {
								const isCompleted = areAllSubtasksCompleted(task);
								const overdue = isTaskOverdue(task.deadline) && !isCompleted;
								const isExpanded = expandedTasks.has(task.name);
								const hasSubtasks = task.subtasks && task.subtasks.length > 0;
								const completedCount = getCompletedSubtaskCount(task);
								const totalSubtasks = task.subtasks?.length || 0;

								return (
									<React.Fragment key={task.name}>
										<ListItem
											component={Link}
											to={`/event/${id}/task/${task.id}`}
											sx={{
												py: 0.5,
												cursor: 'pointer',
												textDecoration: 'none',
												color: 'inherit',
												'&:hover': {
													bgcolor: 'action.hover',
												},
											}}
											secondaryAction={
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													{hasSubtasks && (
														<Chip
															size='small'
															label={`${completedCount}/${totalSubtasks}`}
															color={isCompleted ? 'success' : 'default'}
															variant='outlined'
														/>
													)}
													<CatBat enabled={overdue}>
														<Chip
															size='small'
															label={formatDueDate(task.deadline)}
															color={overdue ? 'error' : 'default'}
															variant={overdue ? 'filled' : 'outlined'}
														/>
													</CatBat>
												</Box>
											}>
											<ListItemIcon sx={{ minWidth: 40 }}>
												<IconButton
													size='small'
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														toggleExpanded(task.name);
													}}
													sx={{
														transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
														transition: 'transform 0.2s',
													}}>
													<ChevronRightIcon />
												</IconButton>
											</ListItemIcon>
											<ListItemText
												primary={
													<Typography
														variant='body2'
														sx={{
															textDecoration: isCompleted ? 'line-through' : 'none',
															color: isCompleted ? 'text.secondary' : 'text.primary',
															fontWeight: 'medium',
														}}>
														{task.name}
													</Typography>
												}
												secondary={task.summary || task.description}
											/>
										</ListItem>

										{/* Description and Subtasks */}
										<Collapse in={isExpanded} timeout='auto' unmountOnExit>
											{task.description && (
												<Box
													sx={{
														pl: 7,
														pr: 2,
														pb: 1,
														pt: 0.5,
														'& p': { margin: '0.5em 0', fontSize: '0.875rem' },
														'& ul, & ol': { margin: '0.5em 0', paddingLeft: '1.5em', fontSize: '0.875rem' },
														'& a': { color: 'primary.main', textDecoration: 'underline' },
														'& strong': { fontWeight: 'bold' },
														color: 'text.secondary',
													}}>
													<ReactMarkdown>{task.description}</ReactMarkdown>
												</Box>
											)}
											{hasSubtasks && (
												<List dense disablePadding sx={{ pl: 4 }}>
													{task.subtasks!.map((subtask) => {
														const subtaskKey = getSubtaskKey(task.name, subtask);
														const isSubtaskCompleted = completedTasks.has(subtaskKey);
														return (
															<ListItem key={subtaskKey} sx={{ py: 0.25 }}>
																<ListItemIcon sx={{ minWidth: 36 }}>
																	<Checkbox
																		edge='start'
																		size='small'
																		checked={isSubtaskCompleted}
																		onChange={() => toggleTask(subtaskKey)}
																		icon={<UncheckedIcon fontSize='small' />}
																		checkedIcon={<CheckCircleIcon color='success' fontSize='small' />}
																	/>
																</ListItemIcon>
																<ListItemText
																	primary={
																		<Typography
																			variant='body2'
																			sx={{
																				textDecoration: isSubtaskCompleted ? 'line-through' : 'none',
																				color: isSubtaskCompleted ? 'text.secondary' : 'text.primary',
																			}}>
																			{subtask}
																		</Typography>
																	}
																/>
															</ListItem>
														);
													})}
												</List>
											)}
										</Collapse>
									</React.Fragment>
								);
							})}
						</List>
					</Paper>
				)}

				{/* Footer Info */}
				<Typography variant='caption' color='text.secondary'>
					Event ID: {event.id} • Created: {new Date(event.createdAt).toLocaleString()}
				</Typography>
			</Box>
		</>
	);
};
