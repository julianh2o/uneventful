"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
const paths_1 = require("./utils/paths");
const ADMINS_FILE = (0, paths_1.getAdminsConfigPath)();
let cachedAdmins = null;
let lastModified = null;
const loadAdminConfig = () => {
    try {
        if (!fs_1.default.existsSync(ADMINS_FILE)) {
            return new Set();
        }
        const stats = fs_1.default.statSync(ADMINS_FILE);
        const currentModified = stats.mtimeMs;
        // Return cached version if file hasn't changed
        if (cachedAdmins && lastModified === currentModified) {
            return cachedAdmins;
        }
        const content = fs_1.default.readFileSync(ADMINS_FILE, 'utf8');
        const config = yaml_1.default.parse(content);
        cachedAdmins = new Set(config.admins?.map((a) => a.phone) || []);
        lastModified = currentModified;
        return cachedAdmins;
    }
    catch (error) {
        console.error('Error loading admin config:', error);
        return new Set();
    }
};
const isAdmin = (phone) => {
    const admins = loadAdminConfig();
    return admins.has(phone);
};
exports.isAdmin = isAdmin;
