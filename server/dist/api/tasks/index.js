"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const router = (0, express_1.Router)();
// GET /api/tasks - Get tasks configuration
router.get('/', (_req, res) => {
    // When running compiled JS, __dirname is /app/server/dist/api/tasks, so we need to go up to /app
    const yamlPath = path_1.default.join(__dirname, '../../../../src/config', 'tasks.yaml');
    try {
        if (!fs_1.default.existsSync(yamlPath)) {
            return res.status(404).json({ error: 'Tasks configuration not found' });
        }
        const fileContents = fs_1.default.readFileSync(yamlPath, 'utf8');
        const tasksConfig = yaml_1.default.parse(fileContents);
        res.json(tasksConfig);
    }
    catch (error) {
        console.error('Error reading tasks configuration:', error);
        res.status(500).json({ error: 'Failed to load tasks configuration' });
    }
});
exports.default = router;
