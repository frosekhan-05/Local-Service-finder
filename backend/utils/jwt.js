// backend/utils/jwt.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export const generateToken = (payload, options = {}) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'kce-app',
    audience: 'kce-users',
    ...options
  });
};

export const verifyToken = (token, options = {}) => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'kce-app',
    audience: 'kce-users',
    ...options
  });
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};