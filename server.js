import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================================
// ROTAS
// ============================================================

import authRoutes from './src/routes/authRoutes.js';
import eventoRoutes from './src/routes/eventoRoutes.js';
import compraRoutes from './src/routes/compraRoutes.js';
import pagamentoRoutes from './src/routes/pagamentoRoutes.js';
import comunidadeRoutes from './src/routes/comunidadeRoutes.js';
import usuarioRoutes from './src/routes/usuarioRoutes.js';
import onboardingRoutes from './src/routes/onboardingRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';

// ============================================================
// CONTROLLERS
// ============================================================

import * as pagamentoController from './src/controllers/pagamentoController.js';

// ============================================================
// DATABASE
// ============================================================

import db from './src/config/database.js';

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  'https://linkah.eu',
  'https://www.linkah.eu',

  'http://localhost:3000',
  'http://127.0.0.1:3000',

  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

const corsOptions = {
  origin(origin, callback) {
    // Permite Postman, servidor, etc.
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed =
      allowedOrigins.includes(origin);

    const isVercelPreview =
      origin.includes('vercel.app') &&
      origin.toLowerCase().includes('linkah');

    if (
      isAllowed ||
      isVercelPreview
    ) {
      return callback(null, true);
    }

    console.log(
      '❌ CORS bloqueado para:',
      origin
    );

    return callback(
      new Error(
        `CORS bloqueado para ${origin}`
      )
    );
  },

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS'
  ],

  credentials: true,

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],

  optionsSuccessStatus: 204
};

app.use(
  cors(corsOptions)
);

app.options(
  '*',
  cors(corsOptions)
);

// ============================================================
// HELMET
// ============================================================

app.use(
  helmet({
    contentSecurityPolicy: false,

    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },

    crossOriginEmbedderPolicy: false
  })
);

// ============================================================
// STRIPE WEBHOOK
// TEM QUE VIR ANTES DO express.json()
// ============================================================

app.post(
  [
    '/api/pagamento/webhook',
    '/api/pagamentos/webhook'
  ],

  express.raw({
    type: 'application/json'
  }),

  (req, res) => {
    const webhookHandler =
      pagamentoController.ouvirStripe ||
      pagamentoController.webhookStripe;

    if (
      typeof webhookHandler ===
      'function'
    ) {
      return webhookHandler(
        req,
        res
      );
    }

    console.error(
      '❌ Webhook Stripe não configurado.'
    );

    return res.status(500).send(
      'Webhook handler not configured'
    );
  }
);

// ============================================================
// PARSERS
// ============================================================

app.use(
  express.json({
    limit: '50mb'
  })
);

app.use(
  express.urlencoded({
    limit: '50mb',
    extended: true
  })
);

// ============================================================
// ARQUIVOS ESTÁTICOS
// ============================================================

app.use(
  '/uploads',
  express.static(
    path.join(
      __dirname,
      'uploads'
    )
  )
);

// ============================================================
// LOG DAS REQUISIÇÕES
// ============================================================

app.use(
  (req, res, next) => {
    console.log(
      `📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url} | Origem: ${
        req.headers.origin ||
        'sem-origin'
      }`
    );

    next();
  }
);

// ============================================================
// BANCO
// ============================================================

async function inicializarBanco() {
  try {
    console.log(
      '🔄 Sincronizando banco de dados...'
    );

    // Testa conexão
    await db.query(
      'SELECT NOW()'
    );

    console.log(
      '✅ PostgreSQL conectado.'
    );

    // ========================================================
    // USUÁRIOS
    // ========================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS public.usuarios (
        id SERIAL PRIMARY KEY,

        nome VARCHAR(255),

        email VARCHAR(255)
          UNIQUE
          NOT NULL,

        senha VARCHAR(255)
          NOT NULL,

        role VARCHAR(50)
          DEFAULT 'user',

        status VARCHAR(50)
          DEFAULT 'Ativo',

        avatar TEXT,

        foto TEXT,

        apelido VARCHAR(80),

        bio TEXT,

        instagram VARCHAR(255),

        linkedin VARCHAR(255),

        stripe_account_id VARCHAR(255),

        telefone VARCHAR(50),

        created_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ========================================================
    // PRODUTORES
    // ========================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS public.produtores (
        id SERIAL PRIMARY KEY,

        nome VARCHAR(255)
          NOT NULL,

        email VARCHAR(255)
          UNIQUE
          NOT NULL,

        senha VARCHAR(255)
          NOT NULL,

        role VARCHAR(50)
          DEFAULT 'produtor',

        status VARCHAR(50)
          DEFAULT 'Ativo',

        avatar TEXT,

        apelido VARCHAR(80),

        bio TEXT,

        instagram VARCHAR(255),

        linkedin VARCHAR(255),

        cpf_cnpj VARCHAR(255),

        telefone VARCHAR(50),

        tipo VARCHAR(10)
          DEFAULT 'PF',

        data_nascimento VARCHAR(50),

        cep VARCHAR(20),

        rua VARCHAR(255),

        numero VARCHAR(50),

        bairro VARCHAR(255),

        estado VARCHAR(10),

        razao_social VARCHAR(255),

        stripe_account_id VARCHAR(255),

        created_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ========================================================
    // EVENTOS
    // ========================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS public.eventos (
        id SERIAL PRIMARY KEY,

        produtor_email VARCHAR(255),

        nome VARCHAR(255)
          NOT NULL,

        descricao TEXT,

        preco DECIMAL(10,2)
          DEFAULT 0,

        imagem_capa TEXT,

        banner_patrocinio TEXT,

        categoria VARCHAR(100),

        data_inicio DATE,

        hora_inicio TIME,

        data_termino DATE,

        hora_termino TIME,

        tipo VARCHAR(50)
          DEFAULT 'Presencial',

        local_nome VARCHAR(255),

        cep VARCHAR(20),

        endereco VARCHAR(255),

        numero VARCHAR(50),

        cidade VARCHAR(255),

        estado VARCHAR(10),

        capacidade INTEGER,

        status VARCHAR(50)
          DEFAULT 'Ativo'
      );
    `);

    // ========================================================
    // ONBOARDING
    //
    // IMPORTANTE:
    // Não usamos FK direta em user_id porque esse ID pode
    // pertencer a usuarios OU produtores.
    //
    // Quem diferencia é tipo_conta.
    // ========================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS public.user_preferences (
        id SERIAL PRIMARY KEY,

        user_id INTEGER
          NOT NULL,

        tipo_conta VARCHAR(20)
          NOT NULL
          DEFAULT 'usuario',

        cidade VARCHAR(255),

        setor VARCHAR(255),

        genero_filme VARCHAR(255),

        personalidade VARCHAR(255),

        qualidades JSONB,

        updated_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ========================================================
    // CHAT
    // ========================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS public.mensagens_match (
        id SERIAL PRIMARY KEY,

        remetente_id INTEGER
          NOT NULL,

        destinatario_id INTEGER
          NOT NULL,

        texto TEXT
          NOT NULL,

        created_at TIMESTAMP
          DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ========================================================
    // MIGRAÇÕES DE USUÁRIOS
    // ========================================================

    const migrations = [
      // USUÁRIOS

      `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS avatar TEXT
      `,

      `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS foto TEXT
      `,

      `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS apelido VARCHAR(80)
      `,

      `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS bio TEXT
      `,

      `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS instagram VARCHAR(255)
      `,

      `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255)
      `,

      `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS telefone VARCHAR(50)
      `,

      `
      ALTER TABLE public.usuarios
      ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255)
      `,

      // ======================================================
      // PRODUTORES
      // ======================================================

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS id SERIAL
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS avatar TEXT
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS apelido VARCHAR(80)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS bio TEXT
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS instagram VARCHAR(255)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(255)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS telefone VARCHAR(50)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) DEFAULT 'PF'
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS data_nascimento VARCHAR(50)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS cep VARCHAR(20)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS rua VARCHAR(255)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS numero VARCHAR(50)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS bairro VARCHAR(255)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS estado VARCHAR(10)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255)
      `,

      `
      ALTER TABLE public.produtores
      ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255)
      `,

      // ======================================================
      // EVENTOS
      // ======================================================

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS descricao TEXT
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS preco DECIMAL(10,2) DEFAULT 0
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS imagem_capa TEXT
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS banner_patrocinio TEXT
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS categoria VARCHAR(100)
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS data_inicio DATE
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS hora_inicio TIME
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS data_termino DATE
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS hora_termino TIME
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'Presencial'
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS local_nome VARCHAR(255)
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS cep VARCHAR(20)
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS endereco VARCHAR(255)
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS numero VARCHAR(50)
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS cidade VARCHAR(255)
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS estado VARCHAR(10)
      `,

      `
      ALTER TABLE public.eventos
      ADD COLUMN IF NOT EXISTS capacidade INTEGER
      `,

      // ======================================================
      // USER PREFERENCES
      // ======================================================

      `
      ALTER TABLE public.user_preferences
      ADD COLUMN IF NOT EXISTS tipo_conta VARCHAR(20)
      DEFAULT 'usuario'
      `,

      `
      ALTER TABLE public.user_preferences
      ADD COLUMN IF NOT EXISTS cidade VARCHAR(255)
      `,

      `
      ALTER TABLE public.user_preferences
      ADD COLUMN IF NOT EXISTS setor VARCHAR(255)
      `,

      `
      ALTER TABLE public.user_preferences
      ADD COLUMN IF NOT EXISTS genero_filme VARCHAR(255)
      `,

      `
      ALTER TABLE public.user_preferences
      ADD COLUMN IF NOT EXISTS personalidade VARCHAR(255)
      `,

      `
      ALTER TABLE public.user_preferences
      ADD COLUMN IF NOT EXISTS qualidades JSONB
      `,

      `
      ALTER TABLE public.user_preferences
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `
    ];

    for (
      const sql of migrations
    ) {
      try {
        await db.query(sql);
      } catch (err) {
        console.error(
          '⚠️ Erro migration:',
          err.message
        );
      }
    }

    // ========================================================
    // CORRIGE O ID DOS PRODUTORES
    // ========================================================

    try {
      await db.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS
        produtores_id_unique
        ON public.produtores(id);
      `);

      console.log(
        '✅ Índice produtores.id pronto.'
      );
    } catch (err) {
      console.error(
        '⚠️ Erro índice produtores:',
        err.message
      );
    }

    // ========================================================
    // REMOVE FK ANTIGA DO ONBOARDING
    //
    // Antes user_preferences.user_id apontava apenas para
    // usuarios(id). Isso impedia produtor.
    // ========================================================

    try {
      await db.query(`
        ALTER TABLE public.user_preferences
        DROP CONSTRAINT IF EXISTS
        user_preferences_user_id_fkey;
      `);

      console.log(
        '✅ FK antiga user_preferences removida.'
      );
    } catch (err) {
      console.error(
        '⚠️ FK onboarding:',
        err.message
      );
    }

    // ========================================================
    // REMOVE UNIQUE ANTIGO DE user_id
    //
    // Agora queremos:
    // UNIQUE(user_id, tipo_conta)
    // ========================================================

    try {
      await db.query(`
        ALTER TABLE public.user_preferences
        DROP CONSTRAINT IF EXISTS
        user_preferences_user_id_key;
      `);

      console.log(
        '✅ Unique antigo do onboarding removido.'
      );
    } catch (err) {
      console.error(
        '⚠️ Unique onboarding:',
        err.message
      );
    }

    // ========================================================
    // GARANTE tipo_conta
    // ========================================================

    try {
      await db.query(`
        UPDATE public.user_preferences
        SET tipo_conta = 'usuario'
        WHERE tipo_conta IS NULL;
      `);

      await db.query(`
        ALTER TABLE public.user_preferences
        ALTER COLUMN tipo_conta
        SET NOT NULL;
      `);
    } catch (err) {
      console.error(
        '⚠️ tipo_conta:',
        err.message
      );
    }

    // ========================================================
    // UNIQUE CORRETO PARA ONBOARDING
    // ========================================================

    try {
      await db.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS
        user_preferences_user_tipo_unique

        ON public.user_preferences(
          user_id,
          tipo_conta
        );
      `);

      console.log(
        '✅ Índice do onboarding pronto.'
      );
    } catch (err) {
      console.error(
        '❌ Erro índice onboarding:',
        err.message
      );
    }

    // ========================================================
    // SINCRONIZA AVATAR ANTIGO
    //
    // Se você já tinha usuários usando "foto",
    // copia para "avatar" quando avatar estiver vazio.
    // ========================================================

    try {
      await db.query(`
        UPDATE public.usuarios
        SET avatar = foto
        WHERE
          (avatar IS NULL OR avatar = '')
          AND foto IS NOT NULL
          AND foto <> '';
      `);
    } catch (err) {
      console.error(
        '⚠️ Sincronização foto/avatar:',
        err.message
      );
    }

    // ========================================================
    // STATUS
    // ========================================================

    const usuarios =
      await db.query(`
        SELECT COUNT(*)::int AS total
        FROM public.usuarios;
      `);

    const produtores =
      await db.query(`
        SELECT COUNT(*)::int AS total
        FROM public.produtores;
      `);

    const onboardings =
      await db.query(`
        SELECT COUNT(*)::int AS total
        FROM public.user_preferences;
      `);

    console.log(
      '========================================'
    );

    console.log(
      '✅ ESTRUTURA DO BANCO PRONTA'
    );

    console.log(
      `👤 Usuários: ${usuarios.rows[0].total}`
    );

    console.log(
      `🎫 Produtores: ${produtores.rows[0].total}`
    );

    console.log(
      `💫 Onboardings: ${onboardings.rows[0].total}`
    );

    console.log(
      '========================================'
    );
  } catch (err) {
    console.error(
      '❌ ERRO CRÍTICO NO BANCO:',
      err
    );

    console.error(
      'Mensagem:',
      err.message
    );
  }
}

// ============================================================
// ROTAS
// ============================================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/eventos',
  eventoRoutes
);

app.use(
  '/api/pagamento',
  pagamentoRoutes
);

app.use(
  '/api/compras',
  compraRoutes
);

app.use(
  '/api/comunidades',
  comunidadeRoutes
);

app.use(
  '/api/usuarios',
  usuarioRoutes
);

app.use(
  '/api/onboarding',
  onboardingRoutes
);

app.use(
  '/api/chat',
  chatRoutes
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  '/ping',
  async (req, res) => {
    try {
      const banco =
        await db.query(
          'SELECT NOW() AS agora'
        );

      return res.status(200).json({
        status:
          'Linkah API Online',

        database:
          'connected',

        timestamp:
          new Date(),

        postgres:
          banco.rows[0].agora
      });
    } catch (err) {
      return res.status(500).json({
        status:
          'Linkah API com erro',

        database:
          'disconnected',

        error:
          err.message
      });
    }
  }
);

// ============================================================
// 404
// ============================================================

app.use(
  (req, res, next) => {
    if (
      res.headersSent
    ) {
      return next();
    }

    return res.status(404).json({
      error:
        'Rota não encontrada.',

      method:
        req.method,

      path:
        req.originalUrl
    });
  }
);

// ============================================================
// TRATAMENTO GLOBAL DE ERROS
// ============================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      '❌ ERRO DETECTADO:',
      err
    );

    if (
      err.message?.includes(
        'CORS'
      )
    ) {
      return res.status(403).json({
        error:
          'CORS Error',

        message:
          'Origem não permitida pela Linkah API'
      });
    }

    // Multer - arquivo muito grande
    if (
      err.code ===
      'LIMIT_FILE_SIZE'
    ) {
      return res.status(400).json({
        error:
          'Arquivo muito grande.',

        message:
          'A imagem pode ter no máximo 10MB.'
      });
    }

    return res.status(500).json({
      error:
        'Internal Server Error',

      message:
        process.env.NODE_ENV ===
        'development'
          ? err.message
          : 'Erro interno no servidor.'
    });
  }
);

// ============================================================
// INICIALIZAÇÃO
// ============================================================

const PORT =
  process.env.PORT ||
  3001;

app.listen(
  PORT,
  '0.0.0.0',
  async () => {
    console.log(
      '========================================'
    );

    console.log(
      `🚀 Linkah API rodando na porta ${PORT}`
    );

    console.log(
      `🌎 Ambiente: ${
        process.env.NODE_ENV ||
        'development'
      }`
    );

    console.log(
      '========================================'
    );

    await inicializarBanco();
  }
);