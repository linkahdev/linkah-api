import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'linkah_secret_fallback_2026';

export function authMiddleware(
  req,
  res,
  next
) {
  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      message: 'Token não fornecido.'
    });
  }

  const token =
    authHeader.split(' ')[1];

  if (
    !token ||
    token === 'undefined' ||
    token === 'null'
  ) {
    return res.status(401).json({
      message: 'Token inválido.'
    });
  }

  try {
    const payload = jwt.verify(
      token,
      JWT_SECRET
    );

    console.log(
      '✅ TOKEN DECODIFICADO:',
      payload
    );

    req.usuarioId = payload.id;
    req.usuarioEmail = payload.email;
    req.usuarioRole =
      payload.role || 'user';

    next();
  } catch (err) {
    console.error(
      '❌ ERRO TOKEN:',
      err.message
    );

    if (
      err.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({
        message: 'Token expirado.'
      });
    }

    return res.status(401).json({
      message: 'Token inválido.'
    });
  }
}

export default authMiddleware;