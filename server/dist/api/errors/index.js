"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// POST /api/errors - Receive client error reports
router.post('/', (req, res) => {
    const { message, stack, url, timestamp, type, componentStack } = req.body;
    if (!message || !url || !timestamp || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    console.error('[Client Error]', {
        type,
        message,
        stack,
        url,
        timestamp,
        componentStack,
    });
    res.status(200).json({ received: true });
});
exports.default = router;
