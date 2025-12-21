import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Typography, Box, TextField, Button, Paper, Alert, CircularProgress } from '@mui/material';

import { APP_TITLE } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../utils/apiClient';

export const Profile = () => {
	const { user, refreshUser } = useAuth();
	const [name, setName] = useState(user?.name || '');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const response = await apiClient('/api/auth/me', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update profile');
			}

			await refreshUser();
			setSuccess(true);
			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Helmet>
				<title>Profile | {APP_TITLE}</title>
			</Helmet>
			<Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
				<Typography variant='h4' gutterBottom>
					Profile
				</Typography>

				<Paper sx={{ p: 3, mt: 3 }}>
					<Box component='form' onSubmit={handleSubmit}>
						{error && (
							<Alert severity='error' sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}
						{success && (
							<Alert severity='success' sx={{ mb: 2 }}>
								Profile updated successfully!
							</Alert>
						)}

						<TextField
							fullWidth
							label='Name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							margin='normal'
							required
							disabled={loading}
						/>

						<TextField
							fullWidth
							label='Phone Number'
							value={user?.phone || ''}
							margin='normal'
							disabled
							helperText="Phone number cannot be changed as it's used for authentication"
						/>

						<Box sx={{ mt: 3 }}>
							<Button
								type='submit'
								variant='contained'
								color='primary'
								size='large'
								disabled={loading || name === user?.name}>
								{loading ? <CircularProgress size={24} /> : 'Save Changes'}
							</Button>
						</Box>
					</Box>
				</Paper>
			</Box>
		</>
	);
};
