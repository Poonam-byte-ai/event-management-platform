const jwt = require('jsonwebtoken');

// Runs before any protected route. Reads "Authorization: Bearer <token>",
// verifies it, and attaches the decoded payload (id, role) to req.user
// so downstream controllers know who's calling and what role they have.
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// Usage: requireRole('admin') on a route, or requireRole('admin','participant')
// if a route is open to either but still needs to know who's calling.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this.' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
