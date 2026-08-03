import { Router } from 'express';
import authController from '../controllers/authController.js';
import { uploadAvatar } from '../config/multer.js';

const router = Router();

// -----------------------------
// 🔐 AUTENTICAÇÃO
// -----------------------------

router.post('/register', authController.registerProdutor);
router.post('/login', authController.login);

// -----------------------------
// 👤 GERENCIAMENTO DE PERFIL
// -----------------------------

router.get('/perfil', authController.getPerfil);
router.put('/perfil', authController.updatePerfil);

router.post(
  '/upload-avatar',
  uploadAvatar.single('avatar'),
  authController.uploadAvatar
);

// -----------------------------
// 🌐 PERFIL PÚBLICO
// -----------------------------

router.get('/perfil-publico', authController.getPerfilPublico);

// -----------------------------
// 🛠️ MANUTENÇÃO
// -----------------------------

router.get('/status', (req, res) => {
  res.status(200).json({
    message: "API de Autenticação Online"
  });
});

export default router;