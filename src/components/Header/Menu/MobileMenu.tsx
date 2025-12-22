import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Menu, MenuItem } from '@mui/material';
import { AccountCircle as AccountCircleIcon } from '@mui/icons-material';

import { SignOut, Settings } from '../../Actions';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { ThemeModeContext } from '../../../contexts';
import { useAuth } from '../../../hooks/useAuth';
import { formatNameWithInitial } from '../../../utils/formatName';

interface MobileMenuProps {
	isMenuOpen: boolean;
	handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
	handleMenuClose: () => void;
	anchorEl: HTMLElement | null;
}

export const MobileMenu = ({ isMenuOpen, handleMenuOpen, handleMenuClose, anchorEl }: MobileMenuProps) => {
	const { toggleThemeMode } = useContext(ThemeModeContext);
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleProfileClick = () => {
		navigate('/profile');
		handleMenuClose();
	};

	const handleLogout = () => {
		handleMenuClose();
		logout();
	};

	return (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={{
				vertical: 'top',
				horizontal: 'right',
			}}
			id='primary-search-account-menu-mobile'
			keepMounted
			transformOrigin={{
				vertical: 'top',
				horizontal: 'right',
			}}
			open={isMenuOpen}
			onClose={handleMenuClose}>
			<Box sx={{ textAlign: 'center' }}>
				<MenuItem onClick={handleProfileClick}>
					<AccountCircleIcon sx={{ mr: 1 }} />
					{user ? formatNameWithInitial(user.firstName, user.lastName) : 'Profile'}
				</MenuItem>
				<MenuItem onClick={toggleThemeMode}>
					<ThemeSwitcher disableTooltip />
					Toggle Theme
				</MenuItem>
				<MenuItem onClick={handleMenuClose}>
					<Settings disableTooltip />
					Settings
				</MenuItem>
				<MenuItem onClick={handleLogout}>
					<SignOut disableTooltip />
					Sign Out
				</MenuItem>
			</Box>
		</Menu>
	);
};
