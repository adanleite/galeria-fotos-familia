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
    cb(null, 'album-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /api/albums - List albums
router.get('/', async (req, res) => {
  try {
    const albums = await getAll(`
      SELECT a.*,
        (SELECT COUNT(*) FROM album_photos ap WHERE ap.album_id = a.id) as photo_count
      FROM albums a
      ORDER BY a.created_at DESC
    `);
    return res.json({ albums });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar álbuns.' });
  }
});

// GET /api/albums/:id - Get single album with photos
router.get('/:id', async (req, res) => {
  try {
    const album = await getRow(`SELECT * FROM albums WHERE id = ?`, [req.params.id]);
    if (!album) return res.status(404).json({ message: 'Álbum não encontrado.' });

    const photos = await getAll(`
      SELECT p.*, e.name as event_name, n.name as nucleus_name
      FROM photos p
      JOIN album_photos ap ON p.id = ap.photo_id
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN family_nuclei n ON p.nucleus_id = n.id
      WHERE ap.album_id = ?
      ORDER BY p.date DESC
    `, [req.params.id]);

    return res.json({ album, photos });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao carregar detalhes do álbum.' });
  }
});

// POST /api/albums
router.post('/', upload.single('cover'), async (req, res) => {
  const { name, description, photo_ids } = req.body;
  if (!name) return res.status(400).json({ message: 'O nome do álbum é obrigatório.' });

  let cover_url = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

  try {
    const result = await runQuery(
      `INSERT INTO albums (name, description, cover_url, created_by) VALUES (?, ?, ?, ?)`,
      [name, description || null, cover_url, req.user.id]
    );

    if (photo_ids) {
      const ids = Array.isArray(photo_ids) ? photo_ids : JSON.parse(photo_ids || '[]');
      for (const pId of ids) {
        await runQuery(`INSERT INTO album_photos (album_id, photo_id) VALUES (?, ?)`, [result.id, pId]);
      }
    }

    return res.status(201).json({ message: 'Álbum criado com sucesso!', album: { id: result.id, name, description, cover_url } });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao criar álbum.' });
  }
});

// POST /api/albums/:id/photos - Add photos to album
router.post('/:id/photos', async (req, res) => {
  const { photo_ids } = req.body;
  if (!photo_ids || !Array.isArray(photo_ids)) {
    return res.status(400).json({ message: 'Informe a lista de fotos a serem adicionadas.' });
  }

  try {
    for (const pId of photo_ids) {
      await runQuery(`INSERT OR IGNORE INTO album_photos (album_id, photo_id) VALUES (?, ?)`, [req.params.id, pId]);
    }
    return res.json({ message: 'Fotos adicionadas ao álbum com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao adicionar fotos ao álbum.' });
  }
});

// DELETE /api/albums/:id
router.delete('/:id', async (req, res) => {
  try {
    await runQuery(`DELETE FROM albums WHERE id = ?`, [req.params.id]);
    return res.json({ message: 'Álbum excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir álbum.' });
  }
});

export default router;
