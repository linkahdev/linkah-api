import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

// =====================================
// 📷 UPLOAD DE EVENTOS
// =====================================

const eventoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'linkah/eventos',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 1200, height: 800, crop: 'limit' }
    ]
  }),
});

// =====================================
// 👤 UPLOAD DE AVATAR
// =====================================

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'linkah/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }),
});

// =====================================
// 🔒 FILTRO DE SEGURANÇA
// =====================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('❌ Tipo de arquivo não permitido'), false);
  }
};

// =====================================
// 📦 LIMITES
// =====================================

const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

// =====================================
// 🚀 EXPORTS
// =====================================

export const uploadEvento = multer({
  storage: eventoStorage,
  fileFilter,
  limits,
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits,
});