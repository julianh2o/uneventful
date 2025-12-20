import React, { useState } from 'react';
import { AppBar, Box, Toolbar } from '@mui/material';

import { Hamburger } from './Hamburger';
import { AppTitle } from './AppTitle';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ProfileButton } from './ProfileButton';
import { More } from '../Actions';
import { DefaultMenu, MobileMenu } from './Menu';

interface HeaderProps {
	toggleNavigation: () => void;
}

export const Header = ({ toggleNavigation }: HeaderProps) => {
	const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);

	const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setMobileMoreAnchorEl(event.currentTarget);

	const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);

	return (
		<>
			<AppBar position='fixed' sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
				<Toolbar disableGutters variant='dense'>
					<Hamburger toggleNavigation={toggleNavigation} />
					<AppTitle />
					<Box sx={{ flexGrow: 1 }} />
					<Box sx={{ display: { xs: 'none', md: 'flex', alignItems: 'center' } }}>
						<ThemeSwitcher />
						<ProfileButton />
					</Box>
					<Box sx={{ display: { xs: 'flex', md: 'none' } }}>
						<More onClick={handleMobileMenuOpen} />
					</Box>
				</Toolbar>
			</AppBar>
			<MobileMenu
				isMenuOpen={Boolean(mobileMoreAnchorEl)}
				handleMenuOpen={handleMobileMenuOpen}
				handleMenuClose={handleMobileMenuClose}
				anchorEl={mobileMoreAnchorEl}
			/>
		</>
	);
};
