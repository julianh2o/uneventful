import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EventDashboard } from './pages/EventDashboard';
import { TaskDetail } from './pages/TaskDetail';
import { EventRegistration } from './pages/EventRegistration';
import { Login } from './pages/Login';
import { AuthVerify } from './pages/AuthVerify';

import { ThemeModeContext } from './contexts';
import { AuthProvider } from './providers/AuthProvider';
import { routes } from './config';
import { Route as AppRoute } from './types';
import { getAppTheme } from './styles/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from './utils/constants';

function App() {
	const [mode, setMode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(DARK_MODE_THEME);

	const themeMode = useMemo(
		() => ({
			toggleThemeMode: () => {
				setMode((prevMode) => (prevMode === LIGHT_MODE_THEME ? DARK_MODE_THEME : LIGHT_MODE_THEME));
			},
		}),
		[]
	);

	const theme = useMemo(() => getAppTheme(mode), [mode]);

	const addRoute = (route: AppRoute) => (
		<ProtectedRoute key={route.key} path={route.path} component={route.component!} exact />
	);

	return (
		<ThemeModeContext.Provider value={themeMode}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Router>
					<ErrorBoundary>
						<AuthProvider>
							<Switch>
								<Route path='/login' component={Login} exact />
								<Route path='/auth/verify' component={AuthVerify} exact />

								<Route path='/'>
									<Layout>
										<Switch>
											<ProtectedRoute path='/event/:id/task/:taskId' component={TaskDetail} exact />
											<ProtectedRoute path='/event/:id/edit' exact>
												<EventRegistration editMode />
											</ProtectedRoute>
											<ProtectedRoute path='/event/:id' component={EventDashboard} exact />
											{routes.map((route: AppRoute) =>
												route.subRoutes ? route.subRoutes.map((item: AppRoute) => addRoute(item)) : addRoute(route)
											)}
										</Switch>
									</Layout>
								</Route>
							</Switch>
						</AuthProvider>
					</ErrorBoundary>
				</Router>
			</ThemeProvider>
		</ThemeModeContext.Provider>
	);
}

export default App;
