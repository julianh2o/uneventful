import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import appRoot from 'app-root-path';

const router = Router();

// GET /api/forms/:formName - Get form configuration
router.get('/:formName', (req, res) => {
	const { formName } = req.params;
	const yamlPath = path.join(appRoot.path, 'src/config', `${formName}.yaml`);

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
