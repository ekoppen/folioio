const jwt = require('jsonwebtoken');

// Middleware to verify JWT token (optional - doesn't fail if no token)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    // No token provided, continue without user
    req.user = null;
    return next();
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      // Token is invalid, continue without user
      req.user = null;
      return next();
    }
    
    req.user = user;
    next();
  });
}

// Middleware to strictly require authentication
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      error: { message: 'Access token required' }
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({
        error: { message: 'Invalid or expired token' }
      });
    }
    
    req.user = user;
    next();
  });
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: { message: 'Admin access required' }
    });
  }
  next();
}

// Middleware to check if user is authenticated (admin or editor)
function requireAuthenticated(req, res, next) {
  if (!['admin', 'editor'].includes(req.user.role)) {
    return res.status(403).json({
      error: { message: 'Authentication required' }
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAuth,
  requireAdmin,
  requireAuthenticated
};