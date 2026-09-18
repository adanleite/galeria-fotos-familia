import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_galeria_familia_2026_segura';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acesso não autorizado. Por favor, faça login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Administrador') {
    return res.status(403).json({ message: 'Apenas administradores podem realizar esta operação.' });
  }
  next();
};
