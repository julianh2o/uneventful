import { createContext } from 'react';
import { AuthUser } from '../services/authService';

export interface IAuthContext {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<IAuthContext>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});
