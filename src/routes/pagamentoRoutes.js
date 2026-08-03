import { Router } from 'express';
import * as pagamentoController from '../controllers/pagamentoController.js';

const router = Router();

// ======================================================
// 1. CONFIGURAÇÃO STRIPE CONNECT
// ======================================================

router.post('/conectar-stripe', pagamentoController.vincularContaStripe);
router.get('/status-stripe', pagamentoController.verificarStatusStripe);

// ======================================================
// 2. CHECKOUT / PAGAMENTO
// ======================================================

router.post('/checkout', pagamentoController.criarSessaoCheckout);

// ======================================================
// 3. WEBHOOK STRIPE
// ======================================================

router.post('/webhook', pagamentoController.webhookStripe);

// ======================================================
// 4. CONSULTAS DE COMPRA
// ======================================================

router.get('/detalhes/:sessionId', pagamentoController.buscarDetalhesCompra);
router.get('/meus-ingressos', pagamentoController.listarMeusIngressos);

// ======================================================
// 5. PARTICIPANTES DO EVENTO
// ======================================================

router.get('/compras-evento/:idEvento', pagamentoController.buscarComprasPorEvento);

export default router;