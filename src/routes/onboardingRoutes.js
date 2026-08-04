import { Router } from 'express';
import { salvarRespostasOnboarding, buscarMatches } from '../controllers/onboardingController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware); // agora ativo — popula req.usuarioId

router.post('/', salvarRespostasOnboarding);
router.get('/matches', buscarMatches);

export default router;