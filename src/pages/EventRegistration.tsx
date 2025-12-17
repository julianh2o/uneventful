import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Box, CircularProgress, Alert } from '@mui/material';

import { DynamicForm } from '../components/DynamicForm';
import { FormConfig } from '../types/FormConfig';
import { APP_TITLE } from '../utils/constants';
import { reportError } from '../utils/errorReporter';

export const EventRegistration = () => {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const response = await fetch('/api/forms/eventForm');
        if (!response.ok) {
          throw new Error('Failed to load form configuration');
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        reportError(err instanceof Error ? err : new Error(errorMessage), 'api');
      } finally {
        setLoading(false);
      }
    };

    fetchFormConfig();
  }, []);

  const handleSubmit = (values: Record<string, string | boolean>) => {
    console.log('Form submitted:', values);
    alert('Form submitted successfully! Check console for values.');
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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert severity="warning">No form configuration found</Alert>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Event Registration | {APP_TITLE}</title>
      </Helmet>
      <DynamicForm config={config} onSubmit={handleSubmit} />
    </>
  );
};
