import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint to get form configuration
app.get('/api/forms/:formName', (req, res) => {
  const { formName } = req.params;
  const yamlPath = path.join(__dirname, '..', 'src', 'config', `${formName}.yaml`);

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

// Endpoint to receive client error reports
app.post('/api/errors', (req, res) => {
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
    userAgent: req.headers['user-agent'],
    componentStack,
  });

  res.status(200).json({ received: true });
});

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
