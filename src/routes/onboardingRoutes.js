import { Router } from 'express';
import { salvarRespostasOnboarding, buscarMatches } from '../controllers/onboardingController.js';
// import { authMiddleware } from '../middlewares/auth.js'; // O middleware que protege suas rotas

const router = Router();

// router.use(authMiddleware); // Protege para exigir login

router.post('/onboarding', salvarRespostasOnboarding);
router.get('/matches', buscarMatches);

export default router;