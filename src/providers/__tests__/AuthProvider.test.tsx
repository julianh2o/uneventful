import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../AuthProvider';
import { AuthContext } from '../../contexts/AuthContext';
import { createMockUser } from '../../test-utils';

// Mock authService
vi.mock('../../services/authService', () => ({
	setAuthToken: vi.fn(),
	removeAuthToken: vi.fn(),
	getCurrentUser: vi.fn(),
}));

import * as authService from '../../services/authService';

describe('AuthProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete (window as any).location;
		(window as any).location = { href: '' };
	});

	describe('Initial Load', () => {
		it('should show loading state initially', () => {
			vi.mocked(authService.getCurrentUser).mockImplementation(
				() => new Promise(() => {}), // Never resolves
			);

			render(
				<AuthProvider>
					<div>Test Child</div>
				</AuthProvider>,
			);

			// Children should still render even during loading
			expect(screen.getByText('Test Child')).toBeInTheDocument();
		});

		it('should call getCurrentUser on mount', async () => {
			vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

			render(
				<AuthProvider>
					<div>Test Child</div>
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(authService.getCurrentUser).toHaveBeenCalled();
			});
		});

		it('should set user when getCurrentUser returns user', async () => {
			const mockUser = createMockUser();
			vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return <div>{context.user?.name || 'No user'}</div>;
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText(mockUser.name)).toBeInTheDocument();
			});
		});

		it('should set loading to false after user is loaded', async () => {
			const mockUser = createMockUser();
			vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return <div>{context.loading ? 'Loading' : 'Not Loading'}</div>;
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			// Initially loading
			expect(screen.getByText('Loading')).toBeInTheDocument();

			// After load completes
			await waitFor(() => {
				expect(screen.getByText('Not Loading')).toBeInTheDocument();
			});
		});

		it('should set user to null when getCurrentUser fails', async () => {
			vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Failed'));

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return <div>{context.user ? 'Has User' : 'No User'}</div>;
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText('No User')).toBeInTheDocument();
			});
		});
	});

	describe('Login', () => {
		it('should set user and save token when login is called', async () => {
			vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

			const mockUser = createMockUser();
			const mockToken = 'test-token-123';

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return (
					<div>
						<div>{context.user?.name || 'No user'}</div>
						<button onClick={() => context.login(mockUser, mockToken)}>Login</button>
					</div>
				);
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText('No user')).toBeInTheDocument();
			});

			// Click login
			screen.getByText('Login').click();

			// Wait for user to be set
			await waitFor(() => {
				expect(screen.getByText(mockUser.name)).toBeInTheDocument();
			});

			expect(authService.setAuthToken).toHaveBeenCalledWith(mockToken);
		});

		it('should update user state when login is called', async () => {
			vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

			const user1 = createMockUser({ name: 'User 1' });
			const user2 = createMockUser({ name: 'User 2' });

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return (
					<div>
						<div>{context.user?.name || 'No user'}</div>
						<button onClick={() => context.login(user1, 'token1')}>Login User 1</button>
						<button onClick={() => context.login(user2, 'token2')}>Login User 2</button>
					</div>
				);
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText('No user')).toBeInTheDocument();
			});

			// Login as user 1
			screen.getByText('Login User 1').click();
			await waitFor(() => {
				expect(screen.getByText('User 1')).toBeInTheDocument();
			});

			// Login as user 2
			screen.getByText('Login User 2').click();
			await waitFor(() => {
				expect(screen.getByText('User 2')).toBeInTheDocument();
			});
		});
	});

	describe('Logout', () => {
		it('should clear user and remove token when logout is called', async () => {
			const mockUser = createMockUser();
			vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return (
					<div>
						<div>{context.user?.name || 'No user'}</div>
						<button onClick={context.logout}>Logout</button>
					</div>
				);
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText(mockUser.name)).toBeInTheDocument();
			});

			// Click logout
			screen.getByText('Logout').click();

			await waitFor(() => {
				expect(authService.removeAuthToken).toHaveBeenCalled();
			});

			expect(window.location.href).toBe('/login');
		});

		it('should redirect to /login after logout', async () => {
			const mockUser = createMockUser();
			vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return <button onClick={context.logout}>Logout</button>;
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText('Logout')).toBeInTheDocument();
			});

			screen.getByText('Logout').click();

			expect(window.location.href).toBe('/login');
		});
	});

	describe('Refresh User', () => {
		it('should fetch and update user when refreshUser is called', async () => {
			const initialUser = createMockUser({ name: 'Initial User' });
			const updatedUser = createMockUser({ name: 'Updated User' });

			vi.mocked(authService.getCurrentUser).mockResolvedValueOnce(initialUser).mockResolvedValueOnce(updatedUser);

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return (
					<div>
						<div>{context.user?.name || 'No user'}</div>
						<button onClick={context.refreshUser}>Refresh</button>
					</div>
				);
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText('Initial User')).toBeInTheDocument();
			});

			// Click refresh
			screen.getByText('Refresh').click();

			await waitFor(() => {
				expect(screen.getByText('Updated User')).toBeInTheDocument();
			});
		});

		it('should call logout when refreshUser fails', async () => {
			const mockUser = createMockUser();
			vi.mocked(authService.getCurrentUser)
				.mockResolvedValueOnce(mockUser)
				.mockRejectedValueOnce(new Error('Failed to refresh'));

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return <button onClick={context.refreshUser}>Refresh</button>;
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText('Refresh')).toBeInTheDocument();
			});

			screen.getByText('Refresh').click();

			await waitFor(() => {
				expect(authService.removeAuthToken).toHaveBeenCalled();
			});

			expect(window.location.href).toBe('/login');
		});
	});

	describe('Context Value', () => {
		it('should provide all required context values', async () => {
			vi.mocked(authService.getCurrentUser).mockResolvedValue(null);

			const TestComponent = () => {
				const context = React.useContext(AuthContext);
				return (
					<div>
						<div>User: {context.user ? 'exists' : 'null'}</div>
						<div>Loading: {context.loading.toString()}</div>
						<div>Login: {typeof context.login}</div>
						<div>Logout: {typeof context.logout}</div>
						<div>RefreshUser: {typeof context.refreshUser}</div>
					</div>
				);
			};

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>,
			);

			await waitFor(() => {
				expect(screen.getByText(/User: null/)).toBeInTheDocument();
				expect(screen.getByText(/Loading: false/)).toBeInTheDocument();
				expect(screen.getByText(/Login: function/)).toBeInTheDocument();
				expect(screen.getByText(/Logout: function/)).toBeInTheDocument();
				expect(screen.getByText(/RefreshUser: function/)).toBeInTheDocument();
			});
		});
	});
});
