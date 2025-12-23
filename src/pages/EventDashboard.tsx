import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, CircularProgress, Alert, Typography, Paper, Chip, Button } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import {
	Event as EventIcon,
	Person as PersonIcon,
	Groups as GroupsIcon,
	CalendarToday as CalendarIcon,
} from '@mui/icons-material';

import { APP_TITLE } from '../utils/constants';
import { useEvent } from '../hooks/useEvent';
import { useTasks } from '../hooks/useTasks';
import { useEventCountdown } from '../hooks/useEventCountdown';
import { NotificationToggle } from '../components/NotificationToggle';
import { TaskDetail } from './TaskDetail';

const CountdownDisplay = ({ days, hours }: { days: number; hours: number }) => {
	const isUnder24Hours = days === 0;
	const value = isUnder24Hours ? hours : days;
	const label = isUnder24Hours ? (hours === 1 ? 'hour' : 'hours') : days === 1 ? 'day' : 'days';

	return (
		<Paper
			sx={{
				py: 2,
				px: 3,
				mb: 0,
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				color: 'white',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 2,
				borderBottomLeftRadius: 0,
				borderBottomRightRadius: 0,
			}}>
			<Typography variant='h6' sx={{ fontWeight: 500 }}>
				Countdown to Event:
			</Typography>
			<Typography variant='h4' fontWeight='bold'>
				{value}
			</Typography>
			<Typography variant='h6' sx={{ fontWeight: 500 }}>
				{label}
			</Typography>
		</Paper>
	);
};

export const EventDashboard = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	// Use custom hooks for data fetching
	const { event, loading, error } = useEvent(id || '');
	const { tasks } = useTasks();
	const countdown = useEventCountdown(event?.data.eventDate, event?.data.eventTime);

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

	return (
		<>
			<Helmet>
				<title>
					{data.eventName || 'Event'} | {APP_TITLE}
				</title>
			</Helmet>
			<Box sx={{ p: 3 }}>
				{/* Countdown Banner */}
				{!countdown.passed && <CountdownDisplay days={countdown.days} hours={countdown.hours} />}

				{/* Header */}
				<Paper
					sx={{
						p: 4,
						mb: 3,
						background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
						color: 'white',
						textAlign: 'center',
						position: 'relative',
						borderTopLeftRadius: countdown.passed ? undefined : 0,
						borderTopRightRadius: countdown.passed ? undefined : 0,
					}}>
					<Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
						<NotificationToggle eventId={id} color='inherit' />
						<Button
							variant='outlined'
							startIcon={<EditIcon />}
							onClick={() => navigate(`/event/${id}/edit`)}
							sx={{
								color: 'white',
								borderColor: 'rgba(255,255,255,0.5)',
								'&:hover': {
									borderColor: 'white',
									bgcolor: 'rgba(255,255,255,0.1)',
								},
							}}>
							Edit
						</Button>
					</Box>
					<EventIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
					<Typography variant='h3' fontWeight='bold' gutterBottom>
						{data.eventName || 'Unnamed Event'}
					</Typography>
					{countdown.passed && (
						<Box sx={{ mt: 2, mb: 2 }}>
							<Chip label='Event is happening now or has passed' color='success' size='medium' />
						</Box>
					)}

					{/* Condensed Event Details */}
					<Box
						sx={{
							mt: 3,
							pt: 3,
							borderTop: '1px solid rgba(255,255,255,0.2)',
							display: 'flex',
							fontSize: '0.875rem',
						}}>
						{/* Date & Time */}
						<Box
							sx={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 0.75,
							}}>
							<CalendarIcon sx={{ fontSize: 18, opacity: 0.9 }} />
							<Typography variant='body2' sx={{ opacity: 0.9 }}>
								{data.eventDate || 'No date'}
								{data.eventTime && ` at ${data.eventTime}`}
							</Typography>
						</Box>

						{/* Host */}
						<Box
							sx={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 0.75,
							}}>
							<PersonIcon sx={{ fontSize: 18, opacity: 0.9 }} />
							<Typography variant='body2' sx={{ opacity: 0.9 }}>
								Hosted by {data.hostName || 'Unknown'}
							</Typography>
						</Box>

						{/* Event Type & Party Size */}
						<Box
							sx={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 0.75,
							}}>
							<GroupsIcon sx={{ fontSize: 18, opacity: 0.9 }} />
							<Typography variant='body2' sx={{ opacity: 0.9 }}>
								{`${data.eventType || 'Event'}: ${data.partySize || 'Unknown'} attendees`}
							</Typography>
						</Box>
					</Box>
				</Paper>

				{/* Tasks */}
				{tasks.map((task) => (
					<TaskDetail key={task.id} eventId={id} taskId={task.id} defaultExpanded={false} />
				))}

				{/* Footer Info */}
				<Typography variant='caption' color='text.secondary'>
					Event ID: {event.id} • Created: {new Date(event.createdAt).toLocaleString()}
				</Typography>
			</Box>
		</>
	);
};
