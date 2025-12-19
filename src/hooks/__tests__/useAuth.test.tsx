import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { MockAuthProvider, createMockUser } from '../../test-utils';

describe('useAuth', () => {
  it('should return context value when inside AuthProvider', () => {
    const mockUser = createMockUser();
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MockAuthProvider user={mockUser}>{children}</MockAuthProvider>,
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.refreshUser).toBe('function');
  });

  it('should return null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MockAuthProvider user={null}>{children}</MockAuthProvider>,
    });

    expect(result.current.user).toBeNull();
  });

  it('should return loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MockAuthProvider loading={true}>{children}</MockAuthProvider>,
    });

    expect(result.current.loading).toBe(true);
  });

  it('should provide login function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MockAuthProvider>{children}</MockAuthProvider>,
    });

    expect(result.current.login).toBeDefined();
    expect(typeof result.current.login).toBe('function');
  });

  it('should provide logout function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MockAuthProvider>{children}</MockAuthProvider>,
    });

    expect(result.current.logout).toBeDefined();
    expect(typeof result.current.logout).toBe('function');
  });

  it('should provide refreshUser function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MockAuthProvider>{children}</MockAuthProvider>,
    });

    expect(result.current.refreshUser).toBeDefined();
    expect(typeof result.current.refreshUser).toBe('function');
  });

  it('should work correctly when inside AuthProvider', () => {
    // This test ensures useAuth returns the context value when properly wrapped
    const mockUser = createMockUser();
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MockAuthProvider user={mockUser}>{children}</MockAuthProvider>,
    });

    // Verify the hook returns valid context
    expect(result.current).toBeDefined();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.refreshUser).toBe('function');
  });
});
