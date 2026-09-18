import express from 'express';
import bcrypt from 'bcryptjs';
import { getAll, getRow, runQuery } from '../db.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyAdmin);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await getAll(`SELECT id, name, username, email, role, status, created_at FROM users ORDER BY id ASC`);
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar lista de usuários.' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { name, username, email, password, role } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  try {
    const existing = await getRow(`SELECT id FROM users WHERE username = ? OR email = ?`, [username, email]);
    if (existing) {
      return res.status(400).json({ message: 'Já existe um usuário cadastrado com este nome de usuário ou e-mail.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'Administrador' ? 'Administrador' : 'Usuário';

    const result = await runQuery(
      `INSERT INTO users (name, username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'active')`,
      [name, username, email, passwordHash, userRole]
    );

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: { id: result.id, name, username, email, role: userRole, status: 'active' },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status, newPassword } = req.body;

  try {
    const user = await getRow(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    let passwordHash = user.password_hash;
    if (newPassword && newPassword.trim().length > 0) {
      passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await runQuery(
      `UPDATE users SET name = ?, email = ?, role = ?, status = ?, password_hash = ? WHERE id = ?`,
      [name || user.name, email || user.email, role || user.role, status || user.status, passwordHash, id]
    );

    return res.json({ message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Você não pode excluir a sua própria conta logada.' });
  }

  try {
    await runQuery(`DELETE FROM users WHERE id = ?`, [id]);
    return res.json({ message: 'Usuário excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir usuário.' });
  }
});

export default router;
