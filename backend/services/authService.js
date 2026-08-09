// backend/services/authService.js
import bcrypt from 'bcryptjs';
import pool from '../config/service.js';

class AuthService {
  // Register new user
  async registerUser(userData) {
    try {
      const { email, password, role } = userData;

      // Check if user already exists
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert user into database
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, role]
      );

      return {
        id: result.insertId,
        email,
        role,
        message: 'User registered successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async loginUser(email, password) {
    try {
      // Find user by email
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = users[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Return user data (without password)
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const [users] = await pool.execute(
        'SELECT id, email, role, created_at FROM users WHERE id = ?',
        [userId]
      );

      return users[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Check if email exists
  async checkEmailExists(email) {
    try {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      return users.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();