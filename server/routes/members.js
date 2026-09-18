import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getAll, getRow, runQuery } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /api/members - List members
router.get('/', async (req, res) => {
  try {
    const { nucleus_id, search } = req.query;
    let sql = `
      SELECT m.*, n.name as nucleus_name,
        (SELECT COUNT(*) FROM photo_members pm WHERE pm.member_id = m.id) as photo_count
      FROM family_members m
      LEFT JOIN family_nuclei n ON m.nucleus_id = n.id
      WHERE 1=1
    `;
    const params = [];

    if (nucleus_id) {
      sql += ` AND m.nucleus_id = ?`;
      params.push(nucleus_id);
    }

    if (search) {
      sql += ` AND (m.name LIKE ? OR m.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY m.name ASC`;
    const members = await getAll(sql, params);
    return res.json({ members });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar membros da família.' });
  }
});

// GET /api/members/:id - Get single member with photos
router.get('/:id', async (req, res) => {
  try {
    const member = await getRow(`
      SELECT m.*, n.name as nucleus_name
      FROM family_members m
      LEFT JOIN family_nuclei n ON m.nucleus_id = n.id
      WHERE m.id = ?
    `, [req.params.id]);

    if (!member) return res.status(404).json({ message: 'Membro da família não encontrado.' });

    const photos = await getAll(`
      SELECT p.*, e.name as event_name, n.name as nucleus_name
      FROM photos p
      JOIN photo_members pm ON p.id = pm.photo_id
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN family_nuclei n ON p.nucleus_id = n.id
      WHERE pm.member_id = ?
      ORDER BY p.date DESC, p.id DESC
    `, [req.params.id]);

    return res.json({ member, photos });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar detalhes do membro.' });
  }
});

// POST /api/members
router.post('/', upload.single('avatar'), async (req, res) => {
  const { nucleus_id, name, birth_date, description } = req.body;
  if (!name || !nucleus_id) {
    return res.status(400).json({ message: 'Nome e Núcleo Familiar são obrigatórios.' });
  }

  let avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : null;

  try {
    const result = await runQuery(
      `INSERT INTO family_members (nucleus_id, name, avatar_url, birth_date, description) VALUES (?, ?, ?, ?, ?)`,
      [nucleus_id, name, avatar_url, birth_date || null, description || null]
    );

    return res.status(201).json({
      message: 'Membro da família cadastrado com sucesso!',
      member: { id: result.id, nucleus_id, name, avatar_url, birth_date, description }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao cadastrar membro da família.' });
  }
});

// PUT /api/members/:id
router.put('/:id', upload.single('avatar'), async (req, res) => {
  const { nucleus_id, name, birth_date, description } = req.body;
  try {
    const member = await getRow(`SELECT * FROM family_members WHERE id = ?`, [req.params.id]);
    if (!member) return res.status(404).json({ message: 'Membro não encontrado.' });

    let avatar_url = member.avatar_url;
    if (req.file) {
      avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    await runQuery(
      `UPDATE family_members SET nucleus_id = ?, name = ?, avatar_url = ?, birth_date = ?, description = ? WHERE id = ?`,
      [
        nucleus_id || member.nucleus_id,
        name || member.name,
        avatar_url,
        birth_date !== undefined ? birth_date : member.birth_date,
        description !== undefined ? description : member.description,
        req.params.id
      ]
    );

    return res.json({ message: 'Membro atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar membro.' });
  }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
  try {
    await runQuery(`DELETE FROM family_members WHERE id = ?`, [req.params.id]);
    return res.json({ message: 'Membro excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir membro.' });
  }
});

export default router;
