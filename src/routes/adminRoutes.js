import express from 'express';
import {
  adminLogin,
  updateAdminCredentials,
} from '../controllers/adminAuthController.js';

const router = express.Router();

// Admin login endpoint (plain text password check)
router.post('/admin/login', adminLogin);

// Update admin credentials (plain text password)
router.post('/admin/update-credentials', updateAdminCredentials);

export default router;
