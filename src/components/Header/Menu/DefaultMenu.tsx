import { Divider, Menu, MenuItem } from '@mui/material';

import { Settings, Preferences, SignOut } from '../../Actions';
import { useAuth } from '../../../hooks/useAuth';

interface DefaultMenuProps {
	isMenuOpen: boolean;
	handleMenuClose: () => void;
	anchorEl: HTMLElement | null;
}

export const DefaultMenu = ({ isMenuOpen, handleMenuClose, anchorEl }: DefaultMenuProps) => {
	const { logout } = useAuth();

	const handleLogout = () => {
		handleMenuClose();
		logout();
	};

	return (
		<Menu anchorEl={anchorEl} id='primary-search-account-menu' keepMounted open={isMenuOpen} onClose={handleMenuClose}>
			<MenuItem onClick={handleMenuClose}>
				<Settings disableTooltip />
				Settings
			</MenuItem>
			<MenuItem onClick={handleMenuClose}>
				<Preferences disableTooltip />
				Preferences
			</MenuItem>
			<Divider />
			<MenuItem onClick={handleLogout}>
				<SignOut disableTooltip />
				Sign Out
			</MenuItem>
		</Menu>
	);
};
