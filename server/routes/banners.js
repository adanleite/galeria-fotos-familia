import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAll, getRow, runQuery } from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

const uploadsDir = path.join(process.cwd(), 'uploads', 'banners');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /api/banners
router.get('/', async (req, res) => {
  try {
    const { onlyActive } = req.query;
    let sql = `SELECT * FROM banners`;
    if (onlyActive === 'true') {
      sql += ` WHERE active = 1`;
    }
    sql += ` ORDER BY display_order ASC, id DESC`;

    const banners = await getAll(sql);
    return res.json({ banners });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar banners.' });
  }
});

// POST /api/banners (Admin)
router.post('/', verifyAdmin, upload.single('image'), async (req, res) => {
  const { title, description, button_text, button_link, active, display_order } = req.body;
  if (!title || !req.file) {
    return res.status(400).json({ message: 'Título e imagem do banner são obrigatórios.' });
  }

  const image_url = `/uploads/banners/${req.file.filename}`;

  try {
    const result = await runQuery(
      `INSERT INTO banners (title, description, image_url, button_text, button_link, active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, image_url, button_text || null, button_link || null, active !== undefined ? (active === 'true' || active === '1' ? 1 : 0) : 1, display_order || 0]
    );

    return res.status(201).json({ message: 'Banner criado com sucesso!', banner: { id: result.id, title, image_url } });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao cadastrar banner.' });
  }
});

// PUT /api/banners/:id (Admin)
router.put('/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  const { title, description, button_text, button_link, active, display_order } = req.body;

  try {
    const banner = await getRow(`SELECT * FROM banners WHERE id = ?`, [req.params.id]);
    if (!banner) return res.status(404).json({ message: 'Banner não encontrado.' });

    let image_url = banner.image_url;
    if (req.file) {
      image_url = `/uploads/banners/${req.file.filename}`;
    }

    await runQuery(
      `UPDATE banners SET title = ?, description = ?, image_url = ?, button_text = ?, button_link = ?, active = ?, display_order = ? WHERE id = ?`,
      [
        title || banner.title,
        description !== undefined ? description : banner.description,
        image_url,
        button_text !== undefined ? button_text : banner.button_text,
        button_link !== undefined ? button_link : banner.button_link,
        active !== undefined ? (active === 'true' || active === '1' || active === 1 ? 1 : 0) : banner.active,
        display_order !== undefined ? parseInt(display_order) : banner.display_order,
        req.params.id
      ]
    );

    return res.json({ message: 'Banner atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar banner.' });
  }
});

// DELETE /api/banners/:id (Admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const banner = await getRow(`SELECT * FROM banners WHERE id = ?`, [req.params.id]);
    if (banner) {
      const imgPath = path.join(process.cwd(), banner.image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await runQuery(`DELETE FROM banners WHERE id = ?`, [req.params.id]);
    return res.json({ message: 'Banner excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir banner.' });
  }
});

export default router;
