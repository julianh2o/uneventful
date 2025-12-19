import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';

import { APP_TITLE } from '../utils/constants';
import { verifyMagicLink } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export const AuthVerify = () => {
  const history = useHistory();
  const location = useLocation();
  const { login } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      try {
        const result = await verifyMagicLink(token);

        if (!result.success || !result.sessionToken || !result.user) {
          setStatus('error');
          setError(result.error || 'Verification failed');
          return;
        }

        login(result.user, result.sessionToken);
        setStatus('success');

        setTimeout(() => {
          history.push('/');
        }, 1000);
      } catch (err) {
        setStatus('error');
        setError('An error occurred during verification');
      }
    };

    verify();
  }, [location, login, history]);

  return (
    <>
      <Helmet>
        <title>Verifying... | {APP_TITLE}</title>
      </Helmet>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {status === 'verifying' && (
            <>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6">Verifying your link...</Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Success!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting you to the app...
              </Typography>
            </>
          )}

          {status === 'error' && (
            <>
              <Error color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mt: 2 }}>
                {error || 'Invalid or expired link'}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Please request a new magic link from the login page.
              </Typography>
            </>
          )}
        </Paper>
      </Box>
    </>
  );
};
