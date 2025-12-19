import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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

	const addRoute = (route: AppRoute) => {
		const Component = route.component;
		if (!Component) return null;
		return <Route key={route.key} path={route.path} element={<ProtectedRoute><Component /></ProtectedRoute>} />;
	};

	return (
		<ThemeModeContext.Provider value={themeMode}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Router>
					<ErrorBoundary>
						<AuthProvider>
							<Routes>
								<Route path='/login' element={<Login />} />
								<Route path='/auth/verify' element={<AuthVerify />} />

								<Route path='/*' element={
									<Layout>
										<Routes>
											<Route path='/event/:id/task/:taskId' element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
											<Route path='/event/:id/edit' element={<ProtectedRoute><EventRegistration editMode /></ProtectedRoute>} />
											<Route path='/event/:id' element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
											{routes.map((route: AppRoute) =>
												route.subRoutes ? route.subRoutes.map((item: AppRoute) => addRoute(item)) : addRoute(route)
											)}
										</Routes>
									</Layout>
								} />
							</Routes>
						</AuthProvider>
					</ErrorBoundary>
				</Router>
			</ThemeProvider>
		</ThemeModeContext.Provider>
	);
}

export default App;
