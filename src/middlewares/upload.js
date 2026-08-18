import multer from 'multer';

// ============================================================
// ARMAZENAMENTO EM MEMÓRIA
// A imagem fica em req.file.buffer para enviarmos ao Cloudinary
// ============================================================

const storage = multer.memoryStorage();

// ============================================================
// TIPOS DE IMAGEM PERMITIDOS
// ============================================================

const tiposPermitidos = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

// ============================================================
// CONFIGURAÇÃO DO MULTER
// ============================================================

const upload = multer({
  storage,

  // Máximo de 10MB
  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, callback) => {
    if (!tiposPermitidos.includes(file.mimetype)) {
      return callback(
        new Error(
          'Formato de imagem inválido. Envie uma imagem JPG, PNG ou WEBP.'
        )
      );
    }

    callback(null, true);
  }
});

export default upload;