import db from '../config/database.js';
import bcrypt from 'bcrypt';

// ============================================================
// LOGIN ADMIN
// ============================================================

export const loginAdmin = async (req, res) => {
  const email = req.body.email
    ? req.body.email.trim()
    : '';

  const password = req.body.password
    ? req.body.password.trim()
    : '';

  try {
    const result = await db.query(
      `
        SELECT *
        FROM public.usuarios
        WHERE email ILIKE $1
      `,
      [email]
    );

    const user = result.rows[0];

    if (
      !user ||
      !(await bcrypt.compare(
        password,
        user.senha
      ))
    ) {
      return res
        .status(401)
        .json({
          error:
            'Credenciais inválidas.'
        });
    }

    if (
      user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({
          error:
            'Acesso não autorizado.'
        });
    }

    return res
      .status(200)
      .json({
        message:
          'Autenticado com sucesso',

        token:
          'linkah_master_token_2026',

        user: {
          id: user.id,
          nome: user.nome,
          apelido:
            user.apelido || null,
          avatar:
            user.avatar ||
            user.foto ||
            null,
          email: user.email,
          role: user.role
        }
      });
  } catch (err) {
    console.error(
      'Erro no login:',
      err.message
    );

    return res
      .status(500)
      .json({
        error:
          'Erro interno no servidor'
      });
  }
};

// ============================================================
// BUSCAR USUÁRIO OU PRODUTOR POR ID
// ============================================================

export const buscarUsuarioPorId = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({
          error:
            'ID não informado.'
        });
    }

    // ========================================================
    // PROCURA EM USUARIOS
    // ========================================================

    let result =
      await db.query(
        `
          SELECT
            id,
            nome,
            apelido,
            email,
            role,
            status,
            avatar,
            foto,
            bio,
            instagram,
            linkedin

          FROM public.usuarios

          WHERE id = $1

          LIMIT 1
        `,
        [id]
      );

    if (
      result.rows.length > 0
    ) {
      const usuario =
        result.rows[0];

      return res
        .status(200)
        .json({
          ...usuario,

          avatar:
            usuario.avatar ||
            usuario.foto ||
            null,

          tipo_conta:
            'usuario'
        });
    }

    // ========================================================
    // NÃO ACHOU? PROCURA EM PRODUTORES
    // ========================================================

    result =
      await db.query(
        `
          SELECT
            id,
            nome,
            apelido,
            email,
            role,
            status,
            avatar,
            bio,
            instagram,
            linkedin

          FROM public.produtores

          WHERE id = $1

          LIMIT 1
        `,
        [id]
      );

    if (
      result.rows.length > 0
    ) {
      const produtor =
        result.rows[0];

      return res
        .status(200)
        .json({
          ...produtor,

          tipo_conta:
            'produtor'
        });
    }

    return res
      .status(404)
      .json({
        error:
          'Usuário não encontrado.'
      });

  } catch (err) {
    console.error(
      '❌ Erro ao buscar usuário por ID:',
      err
    );

    return res
      .status(500)
      .json({
        error:
          'Erro ao buscar usuário.'
      });
  }
};

// ============================================================
// LISTAR USUÁRIOS
// ============================================================

export const listarUsuarios = async (
  req,
  res
) => {
  try {
    const result =
      await db.query(
        `
          SELECT
            id,
            nome,
            apelido,
            email,
            status,
            role,
            avatar,
            foto,
            bio

          FROM public.usuarios

          ORDER BY id DESC
        `
      );

    return res
      .status(200)
      .json(
        result.rows
      );

  } catch (err) {
    console.error(
      'Erro ao listar usuários:',
      err
    );

    return res
      .status(500)
      .json({
        error:
          'Erro ao listar usuários'
      });
  }
};

// ============================================================
// ATUALIZAR USUÁRIO
// ============================================================

export const atualizarUsuario = async (
  req,
  res
) => {
  const { id } =
    req.params;

  const { status } =
    req.body;

  try {
    const result =
      await db.query(
        `
          UPDATE public.usuarios
          SET status = $1
          WHERE id = $2
          RETURNING *
        `,
        [status, id]
      );

    if (
      result.rows.length === 0
    ) {
      return res
        .status(404)
        .json({
          error:
            'Usuário não encontrado.'
        });
    }

    return res
      .status(200)
      .json({
        message:
          'Status atualizado com sucesso',

        user:
          result.rows[0]
      });

  } catch (err) {
    console.error(
      'Erro ao atualizar status:',
      err
    );

    return res
      .status(500)
      .json({
        error:
          'Erro ao atualizar status'
      });
  }
};

// ============================================================
// ALTERAR SENHA
// ============================================================

export const alterarSenha = async (
  req,
  res
) => {
  const { id } =
    req.params;

  const { senha } =
    req.body;

  if (!senha) {
    return res
      .status(400)
      .json({
        error:
          'A senha é obrigatória'
      });
  }

  try {
    const salt =
      await bcrypt.genSalt(
        10
      );

    const hash =
      await bcrypt.hash(
        senha,
        salt
      );

    const result =
      await db.query(
        `
          UPDATE public.usuarios

          SET senha = $1

          WHERE id = $2

          RETURNING id
        `,
        [
          hash,
          id
        ]
      );

    if (
      result.rows.length ===
      0
    ) {
      return res
        .status(404)
        .json({
          error:
            'Usuário não encontrado.'
        });
    }

    return res
      .status(200)
      .json({
        message:
          'Senha alterada com sucesso'
      });

  } catch (err) {
    console.error(
      'Erro ao atualizar senha:',
      err
    );

    return res
      .status(500)
      .json({
        error:
          'Erro ao atualizar senha'
      });
  }
};