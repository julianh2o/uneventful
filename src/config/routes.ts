import { Event as EventIcon, AccountCircle as AccountCircleIcon } from '@mui/icons-material';

import { Home } from '../pages/Home';
import { Profile } from '../pages/Profile';

import { Route } from '../types/Route';

const routes: Array<Route> = [
	{
		key: 'router-home',
		title: 'My Events',
		description: 'My Events',
		component: Home,
		path: '/',
		isEnabled: true,
		icon: EventIcon,
	},
	{
		key: 'router-profile',
		title: 'Profile',
		description: 'Profile',
		component: Profile,
		path: '/profile',
		isEnabled: true,
		icon: AccountCircleIcon,
	},
];

export default routes;
