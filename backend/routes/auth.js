import express from 'express';
import AuthService from '../services/authService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Validate JWT_SECRET exists
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your-super-secure-jwt-secret-key-minimum-32-characters-long') {
  console.error('❌ WARNING: JWT_SECRET is not properly set in environment variables');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production environment');
  }
}

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    if (!['provider', 'customer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }

    const result = await AuthService.registerUser({
      email,
      password,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await AuthService.loginUser(email, password);
    
    // Generate JWT token with enhanced security
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'kce-app',
        audience: 'kce-users'
      }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Verify token route
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'kce-app',
      audience: 'kce-users'
    });
    
    // Get fresh user data
    const user = await AuthService.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'kce-app',
      audience: 'kce-users'
    });
    
    const user = await AuthService.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

export default router;