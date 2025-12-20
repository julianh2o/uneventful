import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const router = Router();

// GET /api/tasks - Get tasks configuration
router.get('/', (_req, res) => {
  // When running compiled JS, __dirname is /app/server/dist/api/tasks, so we need to go up to /app
  const yamlPath = path.join(__dirname, '../../../../src/config', 'tasks.yaml');

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
