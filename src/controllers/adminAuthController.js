import { Admin } from '../models/Admin.js';

const DEFAULT_ADMIN_ID = process.env.ADMIN_ID || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Ensures at least one admin account exists in MongoDB upon server startup.
 */
export async function seedAdminUser() {
  try {
    const existing = await Admin.findOne({ username: DEFAULT_ADMIN_ID });
    if (!existing) {
      await Admin.create({
        username: DEFAULT_ADMIN_ID,
        password: DEFAULT_ADMIN_PASSWORD,
      });
      console.log(`🛡️ Default Admin seeded: ID="${DEFAULT_ADMIN_ID}", Password in plain text`);
    }
  } catch (err) {
    console.error('Error seeding default admin:', err.message);
  }
}

/**
 * Handle Admin Login
 * Compares passwords directly in plain text (unhashed) as specified.
 */
export async function adminLogin(req, res) {
  try {
    const username = (req.body.username || req.body.id || '').trim();
    const password = (req.body.password || '').trim();

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID and Password are both required.',
      });
    }

    // Find admin in MongoDB
    let admin = await Admin.findOne({ username });

    // Fallback: If not in MongoDB yet, check .env credentials
    if (!admin && username === DEFAULT_ADMIN_ID) {
      admin = await Admin.create({
        username: DEFAULT_ADMIN_ID,
        password: DEFAULT_ADMIN_PASSWORD,
      });
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin ID or Password.',
      });
    }

    // Direct plain text password comparison (NO HASHING)
    if (admin.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin ID or Password.',
      });
    }

    // Simple session token
    const sessionToken = Buffer.from(`${admin.username}:${Date.now()}:${admin._id}`).toString('base64');

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token: sessionToken,
      admin: {
        id: admin.username,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: err.message,
    });
  }
}

/**
 * Update Admin Password (saved in simple plain text)
 */
export async function updateAdminCredentials(req, res) {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const adminId = (username || DEFAULT_ADMIN_ID).trim();

    if (!newPassword || newPassword.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 3 characters long.',
      });
    }

    const admin = await Admin.findOne({ username: adminId });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.',
      });
    }

    // If current password provided, verify it
    if (currentPassword && admin.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    // Save in simple plain text
    admin.password = newPassword.trim();
    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Admin password updated successfully in simple text.',
    });
  } catch (err) {
    console.error('Update credentials error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update credentials.',
      error: err.message,
    });
  }
}
