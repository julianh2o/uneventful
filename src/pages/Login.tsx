import { useState, FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { Phone, Person } from '@mui/icons-material';

import { APP_TITLE } from '../utils/constants';
import { requestMagicLink, registerUser } from '../services/authService';

export const Login = () => {
	const [step, setStep] = useState<'phone' | 'name' | 'sent'>('phone');
	const [phone, setPhone] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handlePhoneSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setLoading(true);

		try {
			const result = await requestMagicLink(phone);

			if (!result.success) {
				setError(result.error || 'Failed to send magic link');
				setLoading(false);
				return;
			}

			if (result.requiresRegistration) {
				setStep('name');
			} else {
				setSuccess(result.message);
				setStep('sent');
			}
		} catch (err) {
			setError('An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleNameSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setLoading(true);

		try {
			const result = await registerUser(phone, firstName, lastName);

			if (!result.success) {
				setError(result.error || 'Failed to create account');
				setLoading(false);
				return;
			}

			setSuccess(result.message);
			setStep('sent');
		} catch (err) {
			setError('An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Helmet>
				<title>Login | {APP_TITLE}</title>
			</Helmet>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
					bgcolor: 'background.default',
					p: 2,
				}}>
				<Paper
					elevation={3}
					sx={{
						p: 4,
						maxWidth: 400,
						width: '100%',
					}}>
					<Typography variant='h4' gutterBottom align='center'>
						{APP_TITLE}
					</Typography>

					<Typography variant='body1' color='text.secondary' align='center' sx={{ mb: 3 }}>
						{step === 'phone' && 'Sign in with your phone number'}
						{step === 'name' && 'Welcome! Tell us your name'}
						{step === 'sent' && 'Check your phone!'}
					</Typography>

					{error && (
						<Alert severity='error' sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}
					{success && (
						<Alert severity='success' sx={{ mb: 2 }}>
							{success}
						</Alert>
					)}

					{step === 'phone' && (
						<form onSubmit={handlePhoneSubmit}>
							<TextField
								fullWidth
								label='Phone Number'
								placeholder='+1 (555) 123-4567'
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								disabled={loading}
								required
								InputProps={{
									startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
								}}
								sx={{ mb: 3 }}
							/>

							<Button type='submit' fullWidth variant='contained' size='large' disabled={loading}>
								{loading ? <CircularProgress size={24} /> : 'Continue'}
							</Button>
						</form>
					)}

					{step === 'name' && (
						<form onSubmit={handleNameSubmit}>
							<TextField
								fullWidth
								label='First Name'
								placeholder='John'
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								disabled={loading}
								required
								InputProps={{
									startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
								}}
								sx={{ mb: 2 }}
							/>

							<TextField
								fullWidth
								label='Last Name'
								placeholder='Smith'
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								disabled={loading}
								required
								sx={{ mb: 3 }}
							/>

							<Button type='submit' fullWidth variant='contained' size='large' disabled={loading}>
								{loading ? <CircularProgress size={24} /> : 'Create Account'}
							</Button>

							<Button
								fullWidth
								variant='text'
								size='small'
								onClick={() => setStep('phone')}
								disabled={loading}
								sx={{ mt: 1 }}>
								Use different number
							</Button>
						</form>
					)}

					{step === 'sent' && (
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant='body1' sx={{ mb: 2 }}>
								We sent a magic link to your phone. Click it to sign in!
							</Typography>

							<Typography variant='caption' color='text.secondary' sx={{ mb: 3, display: 'block' }}>
								The link expires in 15 minutes.
							</Typography>

							<Button
								fullWidth
								variant='outlined'
								onClick={() => {
									setStep('phone');
									setPhone('');
									setFirstName('');
									setLastName('');
									setError(null);
									setSuccess(null);
								}}>
								Start Over
							</Button>
						</Box>
					)}
				</Paper>
			</Box>
		</>
	);
};
