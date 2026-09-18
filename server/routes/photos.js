import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAll, getRow, runQuery } from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import { processUploadedImage } from '../services/imageService.js';

const router = express.Router();
router.use(verifyToken);

const uploadsDir = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'foto-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Use JPG, JPEG, PNG, WEBP ou SVG.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// GET /api/photos - Advanced list with filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      nucleus_id,
      event_id,
      category_id,
      member_id,
      date_start,
      date_end,
      location,
      tag,
      year,
      month,
      limit = 100,
      offset = 0
    } = req.query;

    let sql = `
      SELECT DISTINCT p.*, 
        e.name as event_name, 
        c.name as category_name,
        n.name as nucleus_name
      FROM photos p
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN event_categories c ON e.category_id = c.id
      LEFT JOIN family_nuclei n ON p.nucleus_id = n.id
      LEFT JOIN photo_members pm ON p.id = pm.photo_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.location LIKE ? OR p.tags LIKE ? OR e.name LIKE ? OR n.name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    if (nucleus_id) {
      sql += ` AND p.nucleus_id = ?`;
      params.push(nucleus_id);
    }

    if (event_id) {
      sql += ` AND p.event_id = ?`;
      params.push(event_id);
    }

    if (category_id) {
      sql += ` AND e.category_id = ?`;
      params.push(category_id);
    }

    if (member_id) {
      sql += ` AND pm.member_id = ?`;
      params.push(member_id);
    }

    if (date_start) {
      sql += ` AND p.date >= ?`;
      params.push(date_start);
    }

    if (date_end) {
      sql += ` AND p.date <= ?`;
      params.push(date_end);
    }

    if (location) {
      sql += ` AND p.location LIKE ?`;
      params.push(`%${location}%`);
    }

    if (tag) {
      sql += ` AND p.tags LIKE ?`;
      params.push(`%${tag}%`);
    }

    if (year) {
      sql += ` AND strftime('%Y', p.date) = ?`;
      params.push(String(year));
    }

    if (month) {
      const formattedMonth = String(month).padStart(2, '0');
      sql += ` AND strftime('%m', p.date) = ?`;
      params.push(formattedMonth);
    }

    sql += ` ORDER BY p.date DESC, p.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const photos = await getAll(sql, params);

    // Attach members list for each photo
    for (const photo of photos) {
      const members = await getAll(
        `SELECT m.id, m.name, m.avatar_url FROM family_members m JOIN photo_members pm ON m.id = pm.member_id WHERE pm.photo_id = ?`,
        [photo.id]
      );
      photo.members = members;
    }

    return res.json({ photos });
  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    return res.status(500).json({ message: 'Erro ao buscar fotos.' });
  }
});

// GET /api/photos/timeline - Get hierarchical date breakdown (Year -> Month)
router.get('/timeline', async (req, res) => {
  try {
    const dates = await getAll(`
      SELECT DISTINCT 
        strftime('%Y', date) as year, 
        strftime('%m', date) as month,
        COUNT(*) as count
      FROM photos
      WHERE date IS NOT NULL AND date != ''
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `);
    return res.json({ dates });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar linha do tempo.' });
  }
});

// GET /api/photos/:id
router.get('/:id', async (req, res) => {
  try {
    const photo = await getRow(`
      SELECT p.*, e.name as event_name, n.name as nucleus_name
      FROM photos p
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN family_nuclei n ON p.nucleus_id = n.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!photo) return res.status(404).json({ message: 'Foto não encontrada.' });

    const members = await getAll(
      `SELECT m.id, m.name, m.avatar_url FROM family_members m JOIN photo_members pm ON m.id = pm.member_id WHERE pm.photo_id = ?`,
      [photo.id]
    );
    photo.members = members;

    return res.json({ photo });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar foto.' });
  }
});

// POST /api/photos/upload - Multi-photo upload
router.post('/upload', upload.array('photos', 50), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Nenhuma foto foi enviada.' });
  }

  const { event_id, nucleus_id, date, location, description, title, tags, members } = req.body;
  const parsedMembers = members ? (Array.isArray(members) ? members : JSON.parse(members || '[]')) : [];

  try {
    const uploadedPhotos = [];

    for (const file of req.files) {
      const processed = await processUploadedImage(file.path, file.filename);

      const pTitle = title || path.basename(file.originalname, path.extname(file.originalname));
      const pDate = date || new Date().toISOString().split('T')[0];

      const result = await runQuery(
        `INSERT INTO photos (
          filename, original_name, mime_type, size, width, height, filepath, thumbnail_path,
          title, description, event_id, nucleus_id, date, location, tags, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
          processed.width,
          processed.height,
          processed.photoUrl,
          processed.thumbUrl,
          pTitle,
          description || null,
          event_id || null,
          nucleus_id || null,
          pDate,
          location || null,
          tags || null,
          req.user.id
        ]
      );

      // Link members
      if (parsedMembers && parsedMembers.length > 0) {
        for (const mId of parsedMembers) {
          await runQuery(`INSERT INTO photo_members (photo_id, member_id) VALUES (?, ?)`, [result.id, mId]);
        }
      }

      uploadedPhotos.push({ id: result.id, title: pTitle, url: processed.photoUrl, thumb: processed.thumbUrl });
    }

    return res.status(201).json({
      message: `${uploadedPhotos.length} foto(s) enviada(s) com sucesso!`,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Erro no upload de fotos:', error);
    return res.status(500).json({ message: 'Não foi possível enviar a imagem.' });
  }
});

// PUT /api/photos/:id - Update photo metadata
router.put('/:id', async (req, res) => {
  const { title, description, event_id, nucleus_id, date, location, tags, members } = req.body;

  try {
    const photo = await getRow(`SELECT * FROM photos WHERE id = ?`, [req.params.id]);
    if (!photo) return res.status(404).json({ message: 'Foto não encontrada.' });

    await runQuery(
      `UPDATE photos SET title = ?, description = ?, event_id = ?, nucleus_id = ?, date = ?, location = ?, tags = ? WHERE id = ?`,
      [
        title !== undefined ? title : photo.title,
        description !== undefined ? description : photo.description,
        event_id !== undefined ? (event_id || null) : photo.event_id,
        nucleus_id !== undefined ? (nucleus_id || null) : photo.nucleus_id,
        date !== undefined ? date : photo.date,
        location !== undefined ? location : photo.location,
        tags !== undefined ? tags : photo.tags,
        req.params.id
      ]
    );

    if (members !== undefined) {
      await runQuery(`DELETE FROM photo_members WHERE photo_id = ?`, [req.params.id]);
      const memberList = Array.isArray(members) ? members : JSON.parse(members || '[]');
      for (const mId of memberList) {
        await runQuery(`INSERT INTO photo_members (photo_id, member_id) VALUES (?, ?)`, [req.params.id, mId]);
      }
    }

    return res.json({ message: 'Informações da foto atualizadas com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar foto.' });
  }
});

// DELETE /api/photos/:id
router.delete('/:id', async (req, res) => {
  try {
    const photo = await getRow(`SELECT * FROM photos WHERE id = ?`, [req.params.id]);
    if (!photo) return res.status(404).json({ message: 'Foto não encontrada.' });

    // Delete files if exist
    const photoPath = path.join(process.cwd(), photo.filepath);
    const thumbPath = path.join(process.cwd(), photo.thumbnail_path);

    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

    await runQuery(`DELETE FROM photos WHERE id = ?`, [req.params.id]);
    return res.json({ message: 'Foto excluída com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir foto.' });
  }
});

// POST /api/photos/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Selecione fotos para excluir.' });
  }

  try {
    for (const id of ids) {
      const photo = await getRow(`SELECT * FROM photos WHERE id = ?`, [id]);
      if (photo) {
        const photoPath = path.join(process.cwd(), photo.filepath);
        const thumbPath = path.join(process.cwd(), photo.thumbnail_path);
        if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        await runQuery(`DELETE FROM photos WHERE id = ?`, [id]);
      }
    }
    return res.json({ message: `${ids.length} foto(s) excluída(s) com sucesso!` });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir fotos em lote.' });
  }
});

// POST /api/photos/bulk-move
router.post('/bulk-move', async (req, res) => {
  const { ids, event_id, nucleus_id } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Selecione fotos para mover.' });
  }

  try {
    for (const id of ids) {
      await runQuery(
        `UPDATE photos SET event_id = COALESCE(?, event_id), nucleus_id = COALESCE(?, nucleus_id) WHERE id = ?`,
        [event_id || null, nucleus_id || null, id]
      );
    }
    return res.json({ message: `${ids.length} foto(s) movida(s) com sucesso!` });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao mover fotos em lote.' });
  }
});

export default router;
