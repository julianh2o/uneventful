"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
const paths_1 = require("../../utils/paths");
const router = (0, express_1.Router)();
// GET /api/forms/:formName - Get form configuration
router.get('/:formName', (req, res) => {
    const { formName } = req.params;
    const yamlPath = (0, paths_1.getFormConfigPath)(formName);
    try {
        if (!fs_1.default.existsSync(yamlPath)) {
            return res.status(404).json({ error: `Form configuration '${formName}' not found` });
        }
        const fileContents = fs_1.default.readFileSync(yamlPath, 'utf8');
        const formConfig = yaml_1.default.parse(fileContents);
        res.json(formConfig);
    }
    catch (error) {
        console.error('Error reading form configuration:', error);
        res.status(500).json({ error: 'Failed to load form configuration' });
    }
});
exports.default = router;
