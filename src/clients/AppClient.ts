import { IAppContext } from '../contexts/AppContext';

import { User } from '../types/User';

class AppClient implements IAppContext {
	user: User;

	/**
	 * Creates an instance of AppClient.
	 * @memberof AppClient
	 */
	constructor() {
		this.user = {
			id: '1',
			firstName: 'Dwight',
			lastName: 'Schrute',
			phone: '1234567890',
			email: 'dwight.schrute@welcomedeveloper.com',
			createdAt: new Date(),
			updatedAt: new Date(),
			isAdmin: true,
			isActive: true,
			isVerified: true,
		};
	}
}

export default AppClient;
