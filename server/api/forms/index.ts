import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const router = Router();

// GET /api/forms/:formName - Get form configuration
router.get('/:formName', (req, res) => {
  const { formName } = req.params;
  // Calculate path based on whether we're running compiled code or source
  // In development: __dirname is .../server/api/forms, need to go up 3 levels
  // In production: __dirname is .../server/dist/api/forms, need to go up 4 levels
  const isCompiled = __dirname.includes('/dist/');
  const levelsUp = isCompiled ? '../../../../' : '../../../';
  const yamlPath = path.join(__dirname, levelsUp, 'src/config', `${formName}.yaml`);

  try {
    if (!fs.existsSync(yamlPath)) {
      return res.status(404).json({ error: `Form configuration '${formName}' not found` });
    }

    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const formConfig = YAML.parse(fileContents);

    res.json(formConfig);
  } catch (error) {
    console.error('Error reading form configuration:', error);
    res.status(500).json({ error: 'Failed to load form configuration' });
  }
});

export default router;
