import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAll, getRow, runQuery } from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

const uploadsDir = path.join(process.cwd(), 'uploads', 'thumbnails');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /api/events - List events with category & nucleus details
router.get('/', async (req, res) => {
  try {
    const { category_id, nucleus_id, search } = req.query;
    let sql = `
      SELECT e.*, 
        c.name as category_name, 
        n.name as nucleus_name,
        (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id) as photo_count
      FROM events e
      LEFT JOIN event_categories c ON e.category_id = c.id
      LEFT JOIN family_nuclei n ON e.nucleus_id = n.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      sql += ` AND e.category_id = ?`;
      params.push(category_id);
    }
    if (nucleus_id) {
      sql += ` AND e.nucleus_id = ?`;
      params.push(nucleus_id);
    }
    if (search) {
      sql += ` AND (e.name LIKE ? OR e.location LIKE ? OR e.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY e.date DESC, e.id DESC`;
    const events = await getAll(sql, params);
    return res.json({ events });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao buscar eventos.' });
  }
});

// GET /api/events/categories - List categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getAll(`SELECT * FROM event_categories ORDER BY name ASC`);
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar categorias de eventos.' });
  }
});

// POST /api/events/categories - Create category (Admin)
router.post('/categories', verifyAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });

  try {
    const result = await runQuery(`INSERT INTO event_categories (name, description) VALUES (?, ?)`, [name, description]);
    return res.status(201).json({ message: 'Categoria criada com sucesso!', category: { id: result.id, name, description } });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ou categoria já existente.' });
  }
});

// GET /api/events/:id - Get single event with photos
router.get('/:id', async (req, res) => {
  try {
    const event = await getRow(`
      SELECT e.*, c.name as category_name, n.name as nucleus_name
      FROM events e
      LEFT JOIN event_categories c ON e.category_id = c.id
      LEFT JOIN family_nuclei n ON e.nucleus_id = n.id
      WHERE e.id = ?
    `, [req.params.id]);

    if (!event) return res.status(404).json({ message: 'Evento não encontrado.' });

    const photos = await getAll(`
      SELECT p.*, n.name as nucleus_name, e.name as event_name 
      FROM photos p
      LEFT JOIN family_nuclei n ON p.nucleus_id = n.id
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.event_id = ?
      ORDER BY p.date DESC, p.id DESC
    `, [req.params.id]);

    return res.json({ event, photos });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao carregar detalhes do evento.' });
  }
});

// POST /api/events - Create new event
router.post('/', upload.single('cover'), async (req, res) => {
  const { name, category_id, nucleus_id, date, location, description } = req.body;
  if (!name) return res.status(400).json({ message: 'O nome do evento é obrigatório.' });

  let cover_url = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

  try {
    const result = await runQuery(
      `INSERT INTO events (name, category_id, nucleus_id, date, location, description, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, category_id || null, nucleus_id || null, date || null, location || null, description || null, cover_url]
    );

    return res.status(201).json({
      message: 'Evento criado com sucesso!',
      event: { id: result.id, name, category_id, nucleus_id, date, location, description, cover_url }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao criar evento.' });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', upload.single('cover'), async (req, res) => {
  const { name, category_id, nucleus_id, date, location, description } = req.body;
  try {
    const event = await getRow(`SELECT * FROM events WHERE id = ?`, [req.params.id]);
    if (!event) return res.status(404).json({ message: 'Evento não encontrado.' });

    let cover_url = event.cover_url;
    if (req.file) {
      cover_url = `/uploads/thumbnails/${req.file.filename}`;
    }

    await runQuery(
      `UPDATE events SET name = ?, category_id = ?, nucleus_id = ?, date = ?, location = ?, description = ?, cover_url = ? WHERE id = ?`,
      [name || event.name, category_id || event.category_id, nucleus_id || event.nucleus_id, date || event.date, location || event.location, description || event.description, cover_url, req.params.id]
    );

    return res.json({ message: 'Evento atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar evento.' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    await runQuery(`DELETE FROM events WHERE id = ?`, [req.params.id]);
    return res.json({ message: 'Evento excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir evento.' });
  }
});

export default router;
