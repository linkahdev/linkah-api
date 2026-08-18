import { Router } from 'express';

import {
  salvarRespostasOnboarding,
  buscarMatches
} from '../controllers/onboardingController.js';

import {
  authMiddleware
} from '../middlewares/auth.js';

import upload from '../middlewares/upload.js';

const router = Router();

// Todas as rotas abaixo precisam estar autenticadas
router.use(authMiddleware);

// ============================================================
// SALVAR ONBOARDING
// Recebe:
// - cidade
// - setor
// - generoFilme
// - personalidade
// - qualidades
// - apelido
// - avatar (arquivo)
// ============================================================

router.post(
  '/',
  upload.single('avatar'),
  salvarRespostasOnboarding
);

// ============================================================
// BUSCAR MATCHES
// ============================================================

router.get(
  '/matches',
  buscarMatches
);

export default router;