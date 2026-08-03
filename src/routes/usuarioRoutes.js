import { Router } from 'express';
import db from '../config/database.js';
import bcrypt from 'bcrypt';
import * as usuarioController from '../controllers/usuarioController.js';

const router = Router();

/**
 * ==========================================
 * 1️⃣ ROTA DE LOGIN
 * ==========================================
 */
router.post('/login-admin', usuarioController.loginAdmin);

/**
 * ==========================================
 * 2️⃣ LISTAR TODOS (GET /api/usuarios)
 * ==========================================
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, nome, email, status, role FROM public.usuarios ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error.message);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

/**
 * ==========================================
 * 3️⃣ ATUALIZAR STATUS (PUT /api/usuarios/:id)
 * ==========================================
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.query('UPDATE public.usuarios SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: "Status atualizado!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

/**
 * ==========================================
 * 4️⃣ ALTERAR SENHA (PATCH /api/usuarios/:id/senha)
 * ==========================================
 */
router.patch('/:id/senha', async (req, res) => {
  const { id } = req.params;
  const { senha } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senha, salt);

    await db.query('UPDATE public.usuarios SET senha = $1 WHERE id = $2', [hash, id]);
    res.json({ message: "Senha alterada com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar senha" });
  }
});

export default router;