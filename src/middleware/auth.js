const jwt = require('jsonwebtoken');
const { SECRET_JWT_KEY } = require('../config/config');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = req.cookies?.access_token || bearerToken;

  if (!token) {
    return res.status(401).json({ ok: false, message: "No autorizado, token no encontrado." });
  }

  if (!SECRET_JWT_KEY || SECRET_JWT_KEY.length < 32) {
    return res.status(500).json({ ok: false, message: "Configuración JWT insegura o incompleta." });
  }

  try {
    const data = jwt.verify(token, SECRET_JWT_KEY, { algorithms: ['HS256'] });
    req.user = data;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Token inválido." });
  }
};

module.exports = verifyToken;
