const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../database/client');
const { authenticateToken } = require('./middleware');

const router = express.Router();

// Sign up new user
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: { message: 'Email and password are required' }
      });
    }
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: { message: 'User already exists' }
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user in transaction
    const result = await transaction(async (client) => {
      // Insert user
      const userResult = await client.query(
        `INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data, confirmed_at, email_confirmed_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) 
         RETURNING id, email, created_at`,
        [email, hashedPassword, JSON.stringify({ full_name: full_name || '' })]
      );
      
      const user = userResult.rows[0];
      
      // Profile will be created automatically via trigger
      
      return user;
    });
    
    res.status(201).json({
      user: {
        id: result.id,
        email: result.email,
        created_at: result.created_at,
        full_name: full_name || ''
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
});

// Sign in user
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required' }
      });
    }
    
    // Get user with profile
    const userResult = await query(
      `SELECT u.id, u.email, u.encrypted_password, u.created_at,
              p.full_name, p.role
       FROM auth.users u
       LEFT JOIN public.profiles p ON u.id = p.user_id
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.encrypted_password);
    
    if (!validPassword) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' }
      });
    }
    
    // Update last sign in
    await query(
      'UPDATE auth.users SET last_sign_in_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: user.id,
        email: user.email,
        role: user.role || 'editor'
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'portfolio-local-backend'
      }
    );
    
    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400, // 24 hours
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'editor',
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
});

// Get current session
router.get('/session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const userResult = await query(
      `SELECT u.id, u.email, u.created_at,
              p.full_name, p.role
       FROM auth.users u
       LEFT JOIN public.profiles p ON u.id = p.user_id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      access_token: req.headers.authorization?.split(' ')[1],
      token_type: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'editor',
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
});

// Get current user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const userResult = await query(
      `SELECT u.id, u.email, u.created_at,
              p.full_name, p.role
       FROM auth.users u
       LEFT JOIN public.profiles p ON u.id = p.user_id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'editor',
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.sub;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: { message: 'Current password and new password are required' }
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: { message: 'New password must be at least 8 characters long' }
      });
    }

    // Get user's current password
    const userResult = await query(
      'SELECT encrypted_password FROM auth.users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'User not found' }
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.encrypted_password);
    if (!validPassword) {
      return res.status(401).json({
        error: { message: 'Current password is incorrect' }
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE auth.users SET encrypted_password = $1, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
});

// User management routes (admin only)

// Get all users
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;

    // Check if user is admin
    const userRole = await query(
      'SELECT p.role FROM public.profiles p WHERE p.user_id = $1',
      [userId]
    );

    if (userRole.rows.length === 0 || userRole.rows[0].role !== 'admin') {
      return res.status(403).json({
        error: { message: 'Admin access required' }
      });
    }

    // Get all users with profiles
    const usersResult = await query(
      `SELECT u.id, u.email, u.created_at, u.last_sign_in_at,
              p.full_name, p.role, p.updated_at
       FROM auth.users u
       LEFT JOIN public.profiles p ON u.id = p.user_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );

    res.json({
      users: usersResult.rows
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
});

// Update user role
router.put('/users/:id/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;
    const currentUserId = req.user.sub;

    if (!role || !['admin', 'editor'].includes(role)) {
      return res.status(400).json({
        error: { message: 'Valid role is required (admin or editor)' }
      });
    }

    // Check if current user is admin
    const userRole = await query(
      'SELECT p.role FROM public.profiles p WHERE p.user_id = $1',
      [currentUserId]
    );

    if (userRole.rows.length === 0 || userRole.rows[0].role !== 'admin') {
      return res.status(403).json({
        error: { message: 'Admin access required' }
      });
    }

    // Don't allow changing own role
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        error: { message: 'Cannot change your own role' }
      });
    }

    // Update user role
    await query(
      'UPDATE public.profiles SET role = $1, updated_at = NOW() WHERE user_id = $2',
      [role, targetUserId]
    );

    res.json({
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
});

// Deactivate user
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.sub;

    // Check if current user is admin
    const userRole = await query(
      'SELECT p.role FROM public.profiles p WHERE p.user_id = $1',
      [currentUserId]
    );

    if (userRole.rows.length === 0 || userRole.rows[0].role !== 'admin') {
      return res.status(403).json({
        error: { message: 'Admin access required' }
      });
    }

    // Don't allow deactivating own account
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        error: { message: 'Cannot deactivate your own account' }
      });
    }

    // Soft delete user
    await query(
      'UPDATE auth.users SET deleted_at = NOW() WHERE id = $1',
      [targetUserId]
    );

    res.json({
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
});

module.exports = router;