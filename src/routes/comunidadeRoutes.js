import { Router } from 'express';
import * as comunidadeController from '../controllers/comunidadeController.js';

const router = Router();

/**
 * ==========================================
 * ROTAS DE COMUNIDADES / CHAT
 * ==========================================
 */

// --- ROTA PARA O DASHBOARD ADMIN ---
router.get('/total', comunidadeController.getTodasComunidades);

// --- ROTA DA HOME (VITRINE) ---
router.get('/', comunidadeController.getComunidadesVitrine);

// --- ROTA DE PRESENÇA ---
router.get('/presenca/:id', comunidadeController.atualizarPresenca);

// --- ENVIAR MENSAGEM ---
router.post('/enviar', comunidadeController.enviarMensagem);

// --- LISTAR MENSAGENS ---
router.get('/:evento_id', comunidadeController.listarMensagensPorEvento);

export default router;