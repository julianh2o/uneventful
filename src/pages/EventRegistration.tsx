import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Box, CircularProgress, Alert } from '@mui/material';

import { DynamicForm } from '../components/DynamicForm';
import { FormConfig } from '../types/FormConfig';
import { APP_TITLE } from '../utils/constants';
import { reportError } from '../utils/errorReporter';
import { getApiBaseUrl } from '../utils/api';

interface EventRegistrationProps {
  editMode?: boolean;
}

export const EventRegistration = ({ editMode = false }: EventRegistrationProps) => {
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [initialValues, setInitialValues] = useState<Record<string, string | boolean> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch form config
        const configResponse = await fetch(`${getApiBaseUrl()}/api/forms/eventForm`);
        if (!configResponse.ok) {
          throw new Error('Failed to load form configuration');
        }
        const configData = await configResponse.json();
        setConfig(configData);

        // If editing, fetch existing event data
        if (editMode && id) {
          const eventResponse = await fetch(`${getApiBaseUrl()}/api/events/${id}`);
          if (!eventResponse.ok) {
            throw new Error('Failed to load event data');
          }
          const eventData = await eventResponse.json();
          setInitialValues(eventData.data);
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
  }, [editMode, id]);

  const handleSubmit = async (values: Record<string, string | boolean>) => {
    try {
      const url = editMode && id
        ? `${getApiBaseUrl()}/api/events/${id}`
        : `${getApiBaseUrl()}/api/events`;
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error(editMode ? 'Failed to update event' : 'Failed to submit event');
      }
      const responseData = await response.json();
      const eventId = editMode ? id : responseData.id;
      history.push(`/event/${eventId}`);
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
        <title>{editMode ? 'Edit Event' : 'Event Registration'} | {APP_TITLE}</title>
      </Helmet>
      <DynamicForm config={config} initialValues={initialValues} onSubmit={handleSubmit} />
    </>
  );
};
