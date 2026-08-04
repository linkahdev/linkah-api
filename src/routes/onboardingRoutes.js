import { Router } from 'express';
import { salvarRespostasOnboarding, buscarMatches } from '../controllers/onboardingController.js';
// import { authMiddleware } from '../middlewares/auth.js'; // Descomente se for usar autenticação

const router = Router();

// router.use(authMiddleware); 

// Mudando de '/onboarding' para '/' (vai responder em POST /api/onboarding)
router.post('/', salvarRespostasOnboarding);

// Vai responder em GET /api/onboarding/matches
router.get('/matches', buscarMatches);

export default router;