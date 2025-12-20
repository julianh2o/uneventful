"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const events_1 = __importDefault(require("./events"));
const forms_1 = __importDefault(require("./forms"));
const tasks_1 = __importDefault(require("./tasks"));
const health_1 = __importDefault(require("./health"));
const errors_1 = __importDefault(require("./errors"));
const router = (0, express_1.Router)();
// Mount sub-routers
router.use('/auth', auth_1.default);
router.use('/events', events_1.default);
router.use('/forms', forms_1.default);
router.use('/tasks', tasks_1.default);
router.use('/health', health_1.default);
router.use('/errors', errors_1.default);
exports.default = router;
