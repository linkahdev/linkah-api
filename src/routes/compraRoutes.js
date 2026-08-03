import { Router } from 'express';
import * as compraController from '../controllers/compraController.js';

const router = Router();

// Rota para salvar a compra (chamada pelo botão "Comprar Ingressos")
router.post('/checkout', compraController.finalizarCompra);

// Rota que a Navbar chama para o modal
router.get('/meus-ingressos', compraController.listarMinhasCompras);

export default router;