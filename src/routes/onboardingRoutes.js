import { Router } from 'express';
import { salvarRespostasOnboarding, buscarMatches } from '../controllers/onboardingController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', salvarRespostasOnboarding);
router.get('/matches', buscarMatches);

export default router;