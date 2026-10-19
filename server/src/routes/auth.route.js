import { Router } from 'express';
import {
  register,
  login,
  refresh,
  me,
  logout,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

export default router;
