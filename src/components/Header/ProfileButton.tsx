import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import { AccountCircle as AccountCircleIcon } from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';
import { formatNameWithInitial } from '../../utils/formatName';

export const ProfileButton = () => {
	const { user } = useAuth();
	const navigate = useNavigate();

	const handleClick = () => {
		navigate('/profile');
	};

	return (
		<Tooltip title='Profile' placement='bottom' arrow>
			<IconButton
				size='large'
				color='inherit'
				onClick={handleClick}
				sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<AccountCircleIcon />
				<Typography
					variant='body2'
					sx={{
						display: { xs: 'none', md: 'block' },
						textTransform: 'none',
					}}>
					{user ? formatNameWithInitial(user.firstName, user.lastName) : 'User'}
				</Typography>
			</IconButton>
		</Tooltip>
	);
};
