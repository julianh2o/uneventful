import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  Button,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import { APP_TITLE, PAGE_TITLE_HOME } from '../utils/constants';
import { apiClient } from '../utils/apiClient';

interface Event {
  id: string;
  data: {
    eventName?: string;
    hostName?: string;
    eventDate?: string;
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

  const formatEventDate = (dateString?: string): string => {
    if (!dateString) return '';

    try {
      // Parse MM/DD/YYYY format
      const [month, day, year] = dateString.split('/').map(Number);
      const eventDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);

      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Format the date
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      // Add relative time for events within 2 weeks
      if (diffDays >= 0 && diffDays <= 14) {
        if (diffDays === 0) return `${formattedDate} (Today)`;
        if (diffDays === 1) return `${formattedDate} (Tomorrow)`;
        return `${formattedDate} (in ${diffDays} days)`;
      }

      return formattedDate;
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {PAGE_TITLE_HOME} | {APP_TITLE}
        </title>
      </Helmet>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            My Events
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            Create Event
          </Button>
        </Box>
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
              {events.map((event) => {
                const dateDisplay = formatEventDate(event.data.eventDate);
                const secondaryText = [
                  `Hosted by ${event.data.hostName || 'Unknown'}`,
                  dateDisplay,
                ].filter(Boolean).join(' • ');

                return (
                  <ListItem key={event.id} disablePadding>
                    <ListItemButton component={Link} to={`/event/${event.id}`}>
                      <ListItemText
                        primary={event.data.eventName || 'Unnamed Event'}
                        secondary={secondaryText}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>
    </>
  );
};
