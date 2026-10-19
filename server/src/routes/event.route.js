import { Router } from 'express';
import { listEvents, getEvent } from '../controllers/event.controller.js';

const router = Router();

router.get('/', listEvents);
router.get('/:eventId', getEvent);

export default router;
