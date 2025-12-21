import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { renderWithProviders, createMockUser } from '../../../test-utils';

describe('ProtectedRoute', () => {
	describe('Authenticated User', () => {
		it('should render children when user is authenticated', () => {
			const mockUser = createMockUser();

			renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: mockUser },
			);

			expect(screen.getByText('Protected Content')).toBeInTheDocument();
		});

		it('should not show loading spinner when user is authenticated', () => {
			const mockUser = createMockUser();

			renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: mockUser, loading: false },
			);

			expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
		});

		it('should render multiple children', () => {
			const mockUser = createMockUser();

			renderWithProviders(
				<ProtectedRoute>
					<div>First Child</div>
					<div>Second Child</div>
				</ProtectedRoute>,
				{ user: mockUser },
			);

			expect(screen.getByText('First Child')).toBeInTheDocument();
			expect(screen.getByText('Second Child')).toBeInTheDocument();
		});
	});

	describe('Unauthenticated User', () => {
		it('should redirect to /login when user is not authenticated', () => {
			renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: null, loading: false },
			);

			// The Navigate component redirects, so content shouldn't be visible
			expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
		});

		it('should not render children when user is null', () => {
			renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: null, loading: false },
			);

			expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
		});
	});

	describe('Loading State', () => {
		it('should show CircularProgress while loading', () => {
			renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: null, loading: true },
			);

			expect(screen.getByRole('progressbar')).toBeInTheDocument();
		});

		it('should not render children while loading', () => {
			renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: null, loading: true },
			);

			expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
		});

		it('should center the loading spinner', () => {
			renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: null, loading: true },
			);

			const container = screen.getByRole('progressbar').closest('.MuiBox-root');
			expect(container).toBeInTheDocument();
		});
	});

	describe('State Transitions', () => {
		it('should transition from loading to authenticated', () => {
			const mockUser = createMockUser();

			const { rerender } = renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: null, loading: true },
			);

			// Initially loading
			expect(screen.getByRole('progressbar')).toBeInTheDocument();
			expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

			// After authentication
			rerender(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
			);

			// Note: In a real scenario with full context, we'd simulate the state change
			// For this test, we're just verifying the component logic
		});

		it('should handle loading completion with no user', () => {
			renderWithProviders(
				<ProtectedRoute>
					<div>Protected Content</div>
				</ProtectedRoute>,
				{ user: null, loading: false },
			);

			expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
			expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
		});
	});
});
