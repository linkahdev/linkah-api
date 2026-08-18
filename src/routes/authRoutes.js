import { Router } from 'express';

import * as authController from '../controllers/authController.js';

import { uploadAvatar } from '../config/multer.js';

const router = Router();

// ============================================================
// 🤝 AUTENTICAÇÃO DE CONEXÃO
//
// Usado pelo:
// /onboarding/auth
// matches
// chat
// ============================================================

router.post(
  '/conexao/register',
  authController.registerConexao
);

router.post(
  '/conexao/login',
  authController.loginConexao
);

// ============================================================
// 🎫 AUTENTICAÇÃO DE PRODUTOR
//
// Mantemos as rotas antigas para não quebrar
// o restante do sistema.
// ============================================================

router.post(
  '/register',
  authController.registerProdutor
);

router.post(
  '/login',
  authController.login
);

// ============================================================
// 👤 GERENCIAMENTO DE PERFIL
// ============================================================

router.get(
  '/perfil',
  authController.getPerfil
);

router.put(
  '/perfil',
  authController.updatePerfil
);

// ============================================================
// 📸 UPLOAD DE AVATAR
// ============================================================

router.post(
  '/upload-avatar',

  uploadAvatar.single('avatar'),

  authController.uploadAvatar
);

// ============================================================
// 🌐 PERFIL PÚBLICO
// ============================================================

router.get(
  '/perfil-publico',
  authController.getPerfilPublico
);

// ============================================================
// 🛠️ STATUS
// ============================================================

router.get(
  '/status',
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        'API de Autenticação Online',

      rotas: {
        conexao: {
          cadastro:
            '/api/auth/conexao/register',

          login:
            '/api/auth/conexao/login'
        },

        produtor: {
          cadastro:
            '/api/auth/register',

          login:
            '/api/auth/login'
        }
      }
    });
  }
);

export default router;