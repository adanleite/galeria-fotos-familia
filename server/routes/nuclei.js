import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAll, getRow, runQuery } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

const uploadsDir = path.join(process.cwd(), 'uploads', 'thumbnails');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'nucleus-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /api/nuclei - List family nuclei with stats
router.get('/', async (req, res) => {
  try {
    const nuclei = await getAll(`
      SELECT n.*,
        (SELECT COUNT(*) FROM family_members m WHERE m.nucleus_id = n.id) as member_count,
        (SELECT COUNT(*) FROM events e WHERE e.nucleus_id = n.id) as event_count,
        (SELECT COUNT(*) FROM photos p WHERE p.nucleus_id = n.id) as photo_count
      FROM family_nuclei n
      ORDER BY n.name ASC
    `);
    return res.json({ nuclei });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar núcleos familiares.' });
  }
});

// GET /api/nuclei/:id - Get nucleus details with members, events, photos
router.get('/:id', async (req, res) => {
  try {
    const nucleus = await getRow(`SELECT * FROM family_nuclei WHERE id = ?`, [req.params.id]);
    if (!nucleus) return res.status(404).json({ message: 'Núcleo familiar não encontrado.' });

    const members = await getAll(`SELECT * FROM family_members WHERE nucleus_id = ? ORDER BY name ASC`, [req.params.id]);
    const events = await getAll(`
      SELECT e.*, c.name as category_name, (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id) as photo_count
      FROM events e
      LEFT JOIN event_categories c ON e.category_id = c.id
      WHERE e.nucleus_id = ?
      ORDER BY e.date DESC
    `, [req.params.id]);

    const photos = await getAll(`
      SELECT p.*, e.name as event_name 
      FROM photos p
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.nucleus_id = ?
      ORDER BY p.date DESC, p.id DESC
    `, [req.params.id]);

    return res.json({ nucleus, members, events, photos });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao carregar núcleo familiar.' });
  }
});

// POST /api/nuclei
router.post('/', upload.single('cover'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'O nome do núcleo familiar é obrigatório.' });

  let cover_url = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

  try {
    const result = await runQuery(
      `INSERT INTO family_nuclei (name, description, cover_url) VALUES (?, ?, ?)`,
      [name, description || null, cover_url]
    );

    return res.status(201).json({
      message: 'Núcleo familiar criado com sucesso!',
      nucleus: { id: result.id, name, description, cover_url }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao criar núcleo familiar.' });
  }
});

// PUT /api/nuclei/:id
router.put('/:id', upload.single('cover'), async (req, res) => {
  const { name, description } = req.body;
  try {
    const nucleus = await getRow(`SELECT * FROM family_nuclei WHERE id = ?`, [req.params.id]);
    if (!nucleus) return res.status(404).json({ message: 'Núcleo familiar não encontrado.' });

    let cover_url = nucleus.cover_url;
    if (req.file) {
      cover_url = `/uploads/thumbnails/${req.file.filename}`;
    }

    await runQuery(
      `UPDATE family_nuclei SET name = ?, description = ?, cover_url = ? WHERE id = ?`,
      [name || nucleus.name, description !== undefined ? description : nucleus.description, cover_url, req.params.id]
    );

    return res.json({ message: 'Núcleo familiar atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar núcleo familiar.' });
  }
});

// DELETE /api/nuclei/:id
router.delete('/:id', async (req, res) => {
  try {
    await runQuery(`DELETE FROM family_nuclei WHERE id = ?`, [req.params.id]);
    return res.json({ message: 'Núcleo familiar excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir núcleo familiar.' });
  }
});

export default router;
