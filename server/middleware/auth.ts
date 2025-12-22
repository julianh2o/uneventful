import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../auth';

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				phone: string;
				firstName: string;
				lastName: string;
			};
		}
	}
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ error: 'Authentication required' });
		return;
	}

	const decoded = verifySessionToken(token);

	if (!decoded) {
		res.status(403).json({ error: 'Invalid or expired token' });
		return;
	}

	req.user = {
		id: decoded.userId,
		phone: decoded.phone,
		firstName: decoded.firstName,
		lastName: decoded.lastName,
	};

	next();
};
