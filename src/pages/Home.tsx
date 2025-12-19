import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';

import { APP_TITLE, PAGE_TITLE_HOME } from '../utils/constants';
import { apiClient } from '../utils/apiClient';

interface Event {
  id: string;
  data: {
    eventName?: string;
    hostName?: string;
  };
  createdAt: string;
}

export const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient('/api/events');
        if (!response.ok) {
          throw new Error('Failed to load events');
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <>
      <Helmet>
        <title>
          {PAGE_TITLE_HOME} | {APP_TITLE}
        </title>
      </Helmet>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Events
        </Typography>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && events.length === 0 && (
          <Alert severity="info">No events yet. Create one to get started!</Alert>
        )}
        {!loading && !error && events.length > 0 && (
          <Paper>
            <List>
              {events.map((event) => (
                <ListItem key={event.id} disablePadding>
                  <ListItemButton component={Link} to={`/event/${event.id}`}>
                    <ListItemText
                      primary={event.data.eventName || 'Unnamed Event'}
                      secondary={`Hosted by ${event.data.hostName || 'Unknown'}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </>
  );
};
