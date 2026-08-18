import db from '../config/database.js';
import cloudinary from '../config/cloudinary.js';

// ============================================================
// HELPERS
// ============================================================

function normalizarTipoConta(role) {
  return role === 'produtor'
    ? 'produtor'
    : 'usuario';
}

function safeString(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value).trim();
}

function parseQualidades(value) {
  if (!value) {
    return {};
  }

  if (
    typeof value === 'object'
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function uploadBufferToCloudinary(
  buffer,
  userId,
  tipoConta
) {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              'linkah/avatars',

            resource_type:
              'image',

            public_id:
              `${tipoConta}-${userId}-${Date.now()}`,

            overwrite:
              true,

            transformation: [
              {
                width: 600,
                height: 600,
                crop: 'fill',
                gravity: 'face'
              },

              {
                quality: 'auto',
                fetch_format: 'auto'
              }
            ]
          },

          (error, result) => {
            if (error) {
              return reject(
                error
              );
            }

            resolve(result);
          }
        );

      stream.end(buffer);
    }
  );
}

// ============================================================
// SALVAR ONBOARDING
// ============================================================

export const salvarRespostasOnboarding =
  async (req, res) => {
    const client =
      await db.connect();

    try {
      const userId =
        req.usuarioId;

      if (!userId) {
        return res
          .status(401)
          .json({
            error:
              'Usuário não autenticado.'
          });
      }

      const tipoConta =
        normalizarTipoConta(
          req.usuarioRole
        );

      const cidade =
        safeString(
          req.body.cidade
        );

      const setor =
        safeString(
          req.body.setor
        );

      const generoFilme =
        safeString(
          req.body.generoFilme
        );

      const personalidade =
        safeString(
          req.body.personalidade
        );

      const apelido =
        safeString(
          req.body.apelido
        );

      const qualidades =
        parseQualidades(
          req.body.qualidades
        );

      // ======================================================
      // VALIDAÇÕES
      // ======================================================

      if (!cidade) {
        return res
          .status(400)
          .json({
            error:
              'Cidade é obrigatória.'
          });
      }

      if (!apelido) {
        return res
          .status(400)
          .json({
            error:
              'Apelido é obrigatório.'
          });
      }

      if (
        apelido.length < 2
      ) {
        return res
          .status(400)
          .json({
            error:
              'O apelido precisa ter pelo menos 2 caracteres.'
          });
      }

      if (
        apelido.length > 80
      ) {
        return res
          .status(400)
          .json({
            error:
              'O apelido pode ter no máximo 80 caracteres.'
          });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({
            error:
              'Foto de perfil é obrigatória.'
          });
      }

      // ======================================================
      // INICIA TRANSAÇÃO
      // ======================================================

      await client.query(
        'BEGIN'
      );

      // ======================================================
      // VERIFICA CONTA
      // ======================================================

      const tabela =
        tipoConta ===
        'produtor'
          ? 'produtores'
          : 'usuarios';

      const usuarioResult =
        await client.query(
          `
            SELECT
              id,
              nome,
              email,
              avatar,
              apelido,
              bio

            FROM public.${tabela}

            WHERE id = $1

            LIMIT 1
          `,
          [userId]
        );

      if (
        usuarioResult.rows
          .length === 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            error:
              'Conta não encontrada.'
          });
      }

      // ======================================================
      // UPLOAD CLOUDINARY
      // ======================================================

      let avatarUrl = null;

      try {
        const uploadResult =
          await uploadBufferToCloudinary(
            req.file.buffer,
            userId,
            tipoConta
          );

        avatarUrl =
          uploadResult.secure_url;
      } catch (
        uploadError
      ) {
        console.error(
          '❌ Erro Cloudinary:',
          uploadError
        );

        await client.query(
          'ROLLBACK'
        );

        return res
          .status(500)
          .json({
            error:
              'Não foi possível enviar a foto de perfil.'
          });
      }

      // ======================================================
      // SALVA APELIDO + AVATAR
      // ======================================================

      const updateUser =
        await client.query(
          `
            UPDATE public.${tabela}

            SET
              apelido = $1,
              avatar = $2

            WHERE id = $3

            RETURNING
              id,
              nome,
              apelido,
              email,
              avatar,
              bio,
              role
          `,
          [
            apelido,
            avatarUrl,
            userId
          ]
        );

      const user =
        updateUser.rows[0];

      // ======================================================
      // SALVA PREFERÊNCIAS
      // ======================================================

      const queryString = `
        INSERT INTO public.user_preferences (
          user_id,
          tipo_conta,
          cidade,
          setor,
          genero_filme,
          personalidade,
          qualidades,
          updated_at
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7::jsonb,
          NOW()
        )

        ON CONFLICT (
          user_id,
          tipo_conta
        )

        DO UPDATE SET
          cidade =
            EXCLUDED.cidade,

          setor =
            EXCLUDED.setor,

          genero_filme =
            EXCLUDED.genero_filme,

          personalidade =
            EXCLUDED.personalidade,

          qualidades =
            EXCLUDED.qualidades,

          updated_at =
            NOW()

        RETURNING *;
      `;

      const values = [
        userId,
        tipoConta,
        cidade,
        setor,
        generoFilme,
        personalidade,
        JSON.stringify(
          qualidades
        )
      ];

      const preferencesResult =
        await client.query(
          queryString,
          values
        );

      // ======================================================
      // COMMIT
      // ======================================================

      await client.query(
        'COMMIT'
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            'Onboarding concluído com sucesso!',

          data:
            preferencesResult
              .rows[0],

          avatar:
            avatarUrl,

          apelido,

          user: {
            ...user,
            hasOnboarding:
              true
          }
        });
    } catch (error) {
      try {
        await client.query(
          'ROLLBACK'
        );
      } catch {}

      console.error(
        '❌ Erro ao salvar onboarding:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            'Erro interno ao salvar preferências.',

          details:
            process.env.NODE_ENV ===
            'development'
              ? error.message
              : undefined
        });
    } finally {
      client.release();
    }
  };

// ============================================================
// BUSCAR MATCHES
// ============================================================

export const buscarMatches =
  async (req, res) => {
    try {
      const userId =
        req.usuarioId;

      if (!userId) {
        return res
          .status(401)
          .json({
            error:
              'Usuário não autenticado.'
          });
      }

      const tipoConta =
        normalizarTipoConta(
          req.usuarioRole
        );

      // ======================================================
      // BUSCA CIDADE DO USUÁRIO
      // ======================================================

      const minhaCidade =
        await db.query(
          `
            SELECT cidade

            FROM public.user_preferences

            WHERE
              user_id = $1
              AND tipo_conta = $2

            LIMIT 1
          `,
          [
            userId,
            tipoConta
          ]
        );

      const cidade =
        minhaCidade.rows[0]
          ?.cidade || null;

      if (!cidade) {
        return res
          .status(400)
          .json({
            error:
              'Onboarding não concluído.'
          });
      }

      // ======================================================
      // BUSCA MATCHES
      // ======================================================

      const queryMatches = `
        SELECT
          up.id,
          up.user_id,
          up.tipo_conta,
          up.cidade,
          up.setor,
          up.genero_filme,
          up.personalidade,
          up.qualidades,
          up.updated_at,

          COALESCE(
            u.nome,
            p.nome
          ) AS nome,

          COALESCE(
            u.apelido,
            p.apelido
          ) AS apelido,

          COALESCE(
            u.email,
            p.email
          ) AS email,

          COALESCE(
            u.avatar,
            p.avatar
          ) AS avatar,

          COALESCE(
            u.bio,
            p.bio
          ) AS bio

        FROM public.user_preferences up

        LEFT JOIN public.usuarios u
          ON
            up.tipo_conta =
              'usuario'
            AND u.id =
              up.user_id

        LEFT JOIN public.produtores p
          ON
            up.tipo_conta =
              'produtor'
            AND p.id =
              up.user_id

        WHERE
          NOT (
            up.user_id = $1
            AND
            up.tipo_conta = $2
          )

          AND up.cidade = $3

        ORDER BY
          up.updated_at DESC

        LIMIT 20;
      `;

      const matchesResult =
        await db.query(
          queryMatches,
          [
            userId,
            tipoConta,
            cidade
          ]
        );

      // ======================================================
      // NORMALIZA NOME EXIBIDO
      // ======================================================

      const matches =
        matchesResult.rows.map(
          (match) => ({
            ...match,

            // No frontend você pode usar
            // display_name direto se quiser
            display_name:
              match.apelido ||
              match.nome ||
              'Membro Linkah'
          })
        );

      return res
        .status(200)
        .json({
          success: true,

          matches,

          cidade,

          total:
            matches.length
        });
    } catch (error) {
      console.error(
        '❌ Erro ao buscar matches:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            'Erro ao buscar conexões.',

          details:
            process.env.NODE_ENV ===
            'development'
              ? error.message
              : undefined
        });
    }
  };