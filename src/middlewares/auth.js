import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'linkah_secret_fallback_2026';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuarioId = payload.id;
    req.usuarioEmail = payload.email;
    req.usuarioRole = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

export default authMiddleware;