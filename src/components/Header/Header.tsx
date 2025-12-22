import React, { useState } from 'react';
import { AppBar, Box, Toolbar, Button } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

import { AppTitle } from './AppTitle';
import { ProfileButton } from './ProfileButton';
import { More } from '../Actions';
import { MobileMenu } from './Menu';

export const Header = () => {
	const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);
	const location = useLocation();

	const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setMobileMoreAnchorEl(event.currentTarget);

	const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);

	const isActive = (path: string) => location.pathname === path;

	return (
		<>
			<AppBar
				position='fixed'
				sx={{
					zIndex: (theme) => theme.zIndex.drawer + 1,
					background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
					boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
				}}>
				<Toolbar disableGutters sx={{ px: 2 }}>
					<AppTitle />
					<Box sx={{ flexGrow: 1 }} />

					{/* Desktop Navigation */}
					<Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
						<Button
							component={Link}
							to='/'
							startIcon={<EventIcon />}
							sx={{
								color: 'white',
								borderBottom: isActive('/') ? '2px solid #667eea' : '2px solid transparent',
								borderRadius: 0,
								px: 2,
								'&:hover': {
									bgcolor: 'rgba(102, 126, 234, 0.1)',
									borderBottom: '2px solid #667eea',
								},
							}}>
							My Events
						</Button>
						<ProfileButton />
					</Box>

					{/* Mobile Menu Icon */}
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
