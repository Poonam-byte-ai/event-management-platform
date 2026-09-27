const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
// Allows both participant and admin/organizer registration.
async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      prn,
      role,
      interests
    } = req.body;

    // Only these two roles are allowed.
    const accountRole =
      role === 'admin'
        ? 'admin'
        : 'participant';

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'name, email and password are required.'
      });
    }

    // PRN is required only for participants.
    if (accountRole === 'participant' && !prn) {
      return res.status(400).json({
        message: 'prn is required for participant accounts.'
      });
    }

    const existingEmail =
      await userModel.findByEmail(email);

    if (existingEmail) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    // Check PRN only for participants.
    if (accountRole === 'participant') {

      const existingPrn =
        await userModel.findByPrn(prn);

      if (existingPrn) {
        return res.status(409).json({
          message: 'An account with this PRN already exists.'
        });
      }
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const storedPrn =
      accountRole === 'participant'
        ? prn
        : null;

    const storedInterests =
      accountRole === 'participant'
        ? (interests || null)
        : null;

    const userId =
      await userModel.createUser({
        name,
        email,
        passwordHash,
        role: accountRole,
        prn: storedPrn,
        interests: storedInterests
      });

    const token =
      generateToken({
        id: userId,
        role: accountRole
      });

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: userId,
        name,
        email,
        prn: storedPrn,
        interests: storedInterests,
        role: accountRole
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Something went wrong during registration.'
    });
  }
}


// POST /api/auth/login
async function login(req, res) {
  try {

    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'email and password are required.'
      });
    }

    const user =
      await userModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const token =
      generateToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        prn: user.prn
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Something went wrong during login.'
    });
  }
}


// GET /api/auth/me
async function getProfile(req, res) {
  try {

    const user =
      await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    res.json({ user });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Something went wrong.'
    });
  }
}


// PATCH /api/auth/interests
async function updateInterests(req, res) {
  try {

    if (req.user.role !== 'participant') {
      return res.status(403).json({
        message: 'Only participants have interests.'
      });
    }

    const {
      interests
    } = req.body;

    await userModel.updateInterests(
      req.user.id,
      interests || null
    );

    res.json({
      message: 'Interests updated.',
      interests: interests || null
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Failed to update interests.'
    });
  }
}


module.exports = {
  register,
  login,
  getProfile,
  updateInterests
};