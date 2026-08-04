import { Router } from 'express';
import { buscarMensagens, enviarMensagem } from '../controllers/chatController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// Todas as rotas de chat exigem autenticação
router.use(authMiddleware);

router.get('/:id', buscarMensagens);
router.post('/enviar', enviarMensagem);

export default router;