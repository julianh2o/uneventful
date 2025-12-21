"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataPath = exports.getBuildPath = exports.getUsersFilePath = exports.getFormConfigPath = exports.getAdminsConfigPath = exports.getTasksConfigPath = exports.getSmsConfigPath = exports.getConfigPath = void 0;
const path_1 = __importDefault(require("path"));
const app_root_path_1 = __importDefault(require("app-root-path"));
/**
 * Centralized path resolution utility for the server
 * All paths are resolved relative to the application root
 */
/**
 * Get the base config directory path
 * In development: /src/config
 * In production: /build/config
 */
const getConfigPath = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return path_1.default.join(app_root_path_1.default.path, isProduction ? 'build' : 'src', 'config');
};
exports.getConfigPath = getConfigPath;
/**
 * Get the path to the SMS configuration file
 */
const getSmsConfigPath = () => {
    return path_1.default.join((0, exports.getConfigPath)(), 'sms.yml');
};
exports.getSmsConfigPath = getSmsConfigPath;
/**
 * Get the path to the tasks configuration file
 */
const getTasksConfigPath = () => {
    return path_1.default.join((0, exports.getConfigPath)(), 'tasks.yaml');
};
exports.getTasksConfigPath = getTasksConfigPath;
/**
 * Get the path to the admins configuration file
 */
const getAdminsConfigPath = () => {
    return path_1.default.join((0, exports.getConfigPath)(), 'admins.yaml');
};
exports.getAdminsConfigPath = getAdminsConfigPath;
/**
 * Get the path to a specific form configuration file
 * @param formName - The name of the form (e.g., 'eventForm')
 */
const getFormConfigPath = (formName) => {
    return path_1.default.join((0, exports.getConfigPath)(), `${formName}.yaml`);
};
exports.getFormConfigPath = getFormConfigPath;
/**
 * Get the path to the users data file
 */
const getUsersFilePath = () => {
    return path_1.default.join(app_root_path_1.default.path, 'data', 'users.json');
};
exports.getUsersFilePath = getUsersFilePath;
/**
 * Get the path to the frontend build directory
 */
const getBuildPath = () => {
    return path_1.default.join(app_root_path_1.default.path, 'build');
};
exports.getBuildPath = getBuildPath;
/**
 * Get the path to the data directory
 */
const getDataPath = () => {
    return path_1.default.join(app_root_path_1.default.path, 'data');
};
exports.getDataPath = getDataPath;
