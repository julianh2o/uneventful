"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const auth_1 = require("../auth");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    const decoded = (0, auth_1.verifySessionToken)(token);
    if (!decoded) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
    req.user = {
        id: decoded.userId,
        phone: decoded.phone,
        name: decoded.name,
    };
    next();
};
exports.authenticateToken = authenticateToken;
