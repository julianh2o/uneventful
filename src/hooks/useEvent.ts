import { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import { reportError } from '../utils/errorReporter';

export interface EventData {
  eventName?: string;
  hostName?: string;
  hostContact?: string;
  eventDate?: string;
  eventTime?: string;
  partySize?: string;
  specialRequests?: string;
  largePartyAgreement?: boolean;
}

export interface Event {
  id: string;
  data: EventData;
  createdAt: string;
  completedTasks?: string[];
}

interface UseEventResult {
  event: Event | null;
  loading: boolean;
  error: string | null;
}

export const useEvent = (id: string): UseEventResult => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await apiClient(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        reportError(err instanceof Error ? err : new Error(errorMessage), 'api');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  return { event, loading, error };
};
