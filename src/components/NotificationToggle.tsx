import { useState, useEffect } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Notifications, NotificationsOff } from '@mui/icons-material';
import { apiClient } from '../utils/apiClient';

interface NotificationToggleProps {
	eventId: string;
	size?: 'small' | 'medium' | 'large';
	color?: 'inherit' | 'default' | 'primary' | 'secondary';
}

export const NotificationToggle = ({ eventId, size = 'medium', color = 'default' }: NotificationToggleProps) => {
	const [subscribed, setSubscribed] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		checkSubscription();
	}, [eventId]);

	const checkSubscription = async () => {
		try {
			const response = await apiClient(`/api/events/${eventId}/subscribe`);
			if (response.ok) {
				const data = await response.json();
				setSubscribed(data.subscribed);
			}
		} catch (error) {
			console.error('Error checking subscription:', error);
		}
	};

	const toggleSubscription = async () => {
		setLoading(true);
		try {
			const method = subscribed ? 'DELETE' : 'POST';
			const response = await apiClient(`/api/events/${eventId}/subscribe`, {
				method,
			});

			if (response.ok) {
				const data = await response.json();
				setSubscribed(data.subscribed);
			} else {
				console.error('Failed to toggle subscription');
			}
		} catch (error) {
			console.error('Error toggling subscription:', error);
		} finally {
			setLoading(false);
		}
	};

	if (subscribed === null) {
		return null; // Don't show anything while loading initial state
	}

	return (
		<Tooltip title={subscribed ? 'Disable notifications' : 'Enable notifications'} arrow>
			<IconButton
				onClick={(e) => {
					e.stopPropagation(); // Prevent triggering parent click events
					toggleSubscription();
				}}
				size={size}
				color={color}
				disabled={loading}>
				{loading ? (
					<CircularProgress size={size === 'small' ? 16 : size === 'large' ? 28 : 20} />
				) : subscribed ? (
					<Notifications />
				) : (
					<NotificationsOff />
				)}
			</IconButton>
		</Tooltip>
	);
};
