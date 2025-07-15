import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  try {
    const { file } = req.query;
    
    if (!file || !file.endsWith('.js')) {
      return res.status(400).json({ error: 'Invalid file request' });
    }
    
    const filePath = join(process.cwd(), file);
    const content = readFileSync(filePath, 'utf8');
    
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(content);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
}