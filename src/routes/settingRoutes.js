import express from 'express';
import {
  getPaymentQR,
  updatePaymentQR,
  resetPaymentQR,
} from '../controllers/settingController.js';

const router = express.Router();

// Public: Fetch current active QR code & UPI ID for the registration form
router.get('/settings/qr', getPaymentQR);

// Admin: Update payment QR code image or UPI ID
router.post('/settings/qr', updatePaymentQR);

// Admin: Reset payment QR to default
router.post('/settings/qr/reset', resetPaymentQR);

export default router;
