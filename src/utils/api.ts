const API_PORT = 3001;

export const getApiBaseUrl = (): string => {
  return `http://${window.location.hostname}:${API_PORT}`;
};
