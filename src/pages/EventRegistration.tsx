import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, CircularProgress, Alert } from '@mui/material';

import { DynamicForm } from '../components/DynamicForm';
import { FormConfig } from '../types/FormConfig';
import { APP_TITLE } from '../utils/constants';
import { reportError } from '../utils/errorReporter';
import { apiClient } from '../utils/apiClient';
import { AuthContext } from '../contexts/AuthContext';

interface EventRegistrationProps {
	editMode?: boolean;
}

const formatDateForStorage = (isoDate: string): string => {
	// Convert YYYY-MM-DD to MM/DD/YYYY
	const [year, month, day] = isoDate.split('-');
	return `${month}/${day}/${year}`;
};

const formatDateForInput = (usDate: string): string => {
	// Convert MM/DD/YYYY to YYYY-MM-DD
	const [month, day, year] = usDate.split('/');
	return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const formatTimeForStorage = (time24: string): string => {
	// Convert HH:MM (24-hour) to h:MM AM/PM (12-hour)
	const [hours24, minutes] = time24.split(':').map(Number);
	const period = hours24 >= 12 ? 'PM' : 'AM';
	const hours12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight
	return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const formatTimeForInput = (time12: string): string => {
	// Convert h:MM AM/PM to HH:MM (24-hour)
	const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
	if (!match) return time12;
	let hours = parseInt(match[1], 10);
	const minutes = match[2];
	const period = match[3].toUpperCase();
	if (period === 'PM' && hours !== 12) hours += 12;
	if (period === 'AM' && hours === 12) hours = 0;
	return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const EventRegistration = ({ editMode = false }: EventRegistrationProps) => {
	const navigate = useNavigate();
	const { id } = useParams<{ id?: string }>();
	const { user } = useContext(AuthContext);
	const [config, setConfig] = useState<FormConfig | null>(null);
	const [initialValues, setInitialValues] = useState<Record<string, string | boolean> | undefined>(undefined);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch form config
				const configResponse = await apiClient('/api/forms/eventForm', { authenticated: false });
				if (!configResponse.ok) {
					throw new Error('Failed to load form configuration');
				}
				const configData = await configResponse.json();
				setConfig(configData);

				// Prepare initial values with user data
				const baseValues: Record<string, string | boolean> = {};

				// Auto-populate host fields from logged-in user
				if (user) {
					baseValues.hostName = user.name;
					baseValues.hostContact = user.phone;
				}

				// If editing, fetch existing event data and merge with user data
				if (editMode && id) {
					const eventResponse = await apiClient(`/api/events/${id}`);
					if (!eventResponse.ok) {
						throw new Error('Failed to load event data');
					}
					const eventData = await eventResponse.json();

					// Convert date/time from storage format to input format for editing
					const formattedData = { ...eventData.data };
					if (
						formattedData.eventDate &&
						typeof formattedData.eventDate === 'string' &&
						formattedData.eventDate.includes('/')
					) {
						formattedData.eventDate = formatDateForInput(formattedData.eventDate);
					}
					if (
						formattedData.eventTime &&
						typeof formattedData.eventTime === 'string' &&
						(formattedData.eventTime.includes('AM') || formattedData.eventTime.includes('PM'))
					) {
						formattedData.eventTime = formatTimeForInput(formattedData.eventTime);
					}

					setInitialValues({ ...baseValues, ...formattedData });
				} else {
					setInitialValues(baseValues);
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
	}, [editMode, id, user]);

	const handleSubmit = async (values: Record<string, string | boolean>) => {
		try {
			// Transform date and time to expected format
			const transformedValues = { ...values };
			if (typeof values.eventDate === 'string' && values.eventDate.includes('-')) {
				transformedValues.eventDate = formatDateForStorage(values.eventDate);
			}
			if (
				typeof values.eventTime === 'string' &&
				!values.eventTime.includes('AM') &&
				!values.eventTime.includes('PM')
			) {
				transformedValues.eventTime = formatTimeForStorage(values.eventTime);
			}

			const endpoint = editMode && id ? `/api/events/${id}` : '/api/events';
			const method = editMode ? 'PUT' : 'POST';

			const response = await apiClient(endpoint, {
				method,
				body: JSON.stringify(transformedValues),
			});
			if (!response.ok) {
				throw new Error(editMode ? 'Failed to update event' : 'Failed to submit event');
			}
			const responseData = await response.json();
			const eventId = editMode ? id : responseData.id;
			navigate(`/event/${eventId}`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'An error occurred';
			alert(`Error: ${errorMessage}`);
			reportError(err instanceof Error ? err : new Error(errorMessage), 'api');
		}
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

	if (!config) {
		return (
			<Box sx={{ m: 2 }}>
				<Alert severity='warning'>No form configuration found</Alert>
			</Box>
		);
	}

	return (
		<>
			<Helmet>
				<title>
					{editMode ? 'Edit Event' : 'Event Registration'} | {APP_TITLE}
				</title>
			</Helmet>
			<DynamicForm config={config} initialValues={initialValues} onSubmit={handleSubmit} />
		</>
	);
};
