const express = require('express');
const jwt = require('jsonwebtoken');
const SupabaseStudentRepository = require('../repositories/supabaseStudentRepository');

const studentRepo = new SupabaseStudentRepository();
const router = express.Router();

// POST /api/auth/verify — Student verification (no password, just reg_number + name)
router.post('/verify', async (req, res) => {
  try {
    const { registration_number, name } = req.body;

    if (!registration_number || !name) {
      return res.status(400).json({ error: 'Registration number and name are required.' });
    }

    const student = await studentRepo.findByRegistrationNumber(registration_number);

    if (!student) {
      return res.status(404).json({ error: 'Student not found. Please check your registration number.' });
    }

    // Normalize name comparison
    const normalizedInput = name.trim().toLowerCase();
    const normalizedStored = student.name.trim().toLowerCase();

    if (normalizedInput !== normalizedStored) {
      return res.status(401).json({ error: 'Name does not match our records.' });
    }

    const token = jwt.sign(
      {
        id: student.id,
        registration_number: student.registration_number,
        name: student.name,
        role: 'student',
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      student: {
        id: student.id,
        registration_number: student.registration_number,
        name: student.name,
        email: student.email,
        class: student.class,
        section: student.section,
      },
    });
  } catch (err) {
    console.error('Auth verify error:', err);
    return res.status(500).json({ error: 'Server error during verification.' });
  }
});

// POST /api/auth/admin-login — Admin & SuperAdmin login
router.post('/admin-login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const superUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const superPassword = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === superUsername && password === superPassword) {
      const token = jwt.sign(
        { role: 'superadmin', username: superUsername },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      return res.json({ token, username: superUsername, role: 'superadmin' });
    }

    if (username === adminUsername && password === adminPassword) {
      const token = jwt.sign(
        { role: 'admin', username: adminUsername },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      return res.json({ token, username: adminUsername, role: 'admin' });
    }

    return res.status(401).json({ error: 'Invalid admin or superadmin credentials.' });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Server error during admin login.' });
  }
});

// GET /api/auth/me — Validate current token
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ valid: true, user: decoded });
  } catch {
    return res.status(401).json({ valid: false, error: 'Invalid token.' });
  }
});

module.exports = router;
