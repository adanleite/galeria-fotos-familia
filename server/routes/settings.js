import express from 'express';
import path from 'path';
import fs from 'fs';
import { getAll, getRow, runQuery } from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const rows = await getAll(`SELECT * FROM system_settings`);
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return res.json({ settings });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar configurações.' });
  }
});

// POST /api/settings (Admin)
router.post('/', verifyAdmin, async (req, res) => {
  const settings = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      await runQuery(`INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)`, [key, String(value)]);
    }
    return res.json({ message: 'Configurações salvas com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao salvar configurações.' });
  }
});

// GET /api/settings/storage (Admin)
router.get('/storage', verifyAdmin, async (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    let totalSize = 0;
    const getDirectorySize = (dirPath) => {
      if (!fs.existsSync(dirPath)) return 0;
      const files = fs.readdirSync(dirPath);
      let size = 0;
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          size += getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      });
      return size;
    };

    totalSize = getDirectorySize(uploadsDir);
    const dbSize = fs.existsSync(path.join(process.cwd(), 'server', 'data', 'gallery.db'))
      ? fs.statSync(path.join(process.cwd(), 'server', 'data', 'gallery.db')).size
      : 0;

    return res.json({
      storage: {
        photosSizeMb: (totalSize / (1024 * 1024)).toFixed(2),
        databaseSizeMb: (dbSize / (1024 * 1024)).toFixed(2),
        totalSizeMb: ((totalSize + dbSize) / (1024 * 1024)).toFixed(2)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao calcular armazenamento.' });
  }
});

export default router;
