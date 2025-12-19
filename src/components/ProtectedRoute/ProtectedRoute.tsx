import React, { FC, ReactNode } from 'react';
import { Route, Redirect } from 'react-router-dom';
import type { RouteProps } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps extends Omit<RouteProps, 'component'> {
  component?: React.ComponentType<any>;
  children?: ReactNode;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ component: Component, children, ...rest }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        user ? (
          Component ? (
            <Component {...props} />
          ) : (
            children
          )
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};
