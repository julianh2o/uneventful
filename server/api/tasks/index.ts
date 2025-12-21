import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const router = Router();

// GET /api/tasks - Get tasks configuration
router.get('/', (_req, res) => {
  // Calculate path based on whether we're running compiled code or source
  // In development: __dirname is .../server/api/tasks, need to go up 3 levels
  // In production: __dirname is .../server/dist/api/tasks, need to go up 4 levels
  const isCompiled = __dirname.includes('/dist/');
  const levelsUp = isCompiled ? '../../../../' : '../../../';
  const yamlPath = path.join(__dirname, levelsUp, 'src/config', 'tasks.yaml');

  try {
    if (!fs.existsSync(yamlPath)) {
      return res.status(404).json({ error: 'Tasks configuration not found' });
    }

    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const tasksConfig = YAML.parse(fileContents);

    res.json(tasksConfig);
  } catch (error) {
    console.error('Error reading tasks configuration:', error);
    res.status(500).json({ error: 'Failed to load tasks configuration' });
  }
});

export default router;
