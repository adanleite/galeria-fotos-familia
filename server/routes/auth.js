import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRow, runQuery } from '../db.js';
import { verifyToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password, rememberMe } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Por favor, preencha o usuário/e-mail e a senha.' });
  }

  try {
    const user = await getRow(
      `SELECT * FROM users WHERE username = ? OR email = ?`,
      [usernameOrEmail, usernameOrEmail]
    );

    if (!user) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Esta conta de usuário foi desativada pelo administrador.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn }
    );

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno ao realizar autenticação.' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getRow(`SELECT id, name, username, email, role, status, created_at FROM users WHERE id = ?`, [req.user.id]);
    if (!user || user.status === 'disabled') {
      return res.status(401).json({ message: 'Usuário inválido ou inativo.' });
    }
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao verificar sessão.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Preencha a senha atual e a nova senha.' });
  }

  try {
    const user = await getRow(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha atual incorreta.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await runQuery(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, req.user.id]);

    return res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao alterar a senha.' });
  }
});

export default router;
