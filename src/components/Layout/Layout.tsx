/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { FC, ReactNode } from 'react';
import { Box, Container } from '@mui/material';

import { Header } from '../Header';
import { Footer } from '../Footer';

import { FOOTER_HEIGHT } from '../../utils/constants';

interface LayoutProps {
	children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
	return (
		<div
			css={css`
				min-height: 100vh;
				display: flex;
				flex-direction: column;
			`}>
			<Box component='header'>
				<Header />
			</Box>
			<Box
				component='main'
				sx={{
					flexGrow: 1,
					pt: 10,
					pb: 4,
					minHeight: `calc(100vh - ${FOOTER_HEIGHT}px)`,
				}}>
				<Container maxWidth='md'>{children}</Container>
			</Box>
			<Box component='footer'>
				<Footer />
			</Box>
		</div>
	);
};
