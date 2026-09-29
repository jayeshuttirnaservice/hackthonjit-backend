import express from 'express';
import {
  createRegistration,
  getRegistrations,
  getRegistrationStats,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
} from '../controllers/registrationController.js';

const router = express.Router();

// Public registration endpoint
router.post('/register', createRegistration);

// Admin endpoints
router.get('/registrations', getRegistrations);
router.get('/registrations/stats', getRegistrationStats);
router.patch('/registrations/:id/approve', approveRegistration);
router.patch('/registrations/:id/reject', rejectRegistration);
router.delete('/registrations/:id', deleteRegistration);

export default router;
