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

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

// ============================================================
// UPLOAD CLOUDINARY
// ============================================================

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

            transformation: [
              {
                width: 600,
                height: 600,
                crop: 'fill',
                gravity: 'auto'
              },

              {
                quality: 'auto',
                fetch_format: 'auto'
              }
            ]
          },

          (error, result) => {
            if (error) {
              console.error(
                '❌ CLOUDINARY:',
                error
              );

              reject(error);
              return;
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

      console.log(
        '📝 ONBOARDING:',
        {
          userId,
          tipoConta,
          temArquivo:
            Boolean(req.file)
        }
      );

      // ======================================================
      // FORM DATA
      // ======================================================

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
      // VALIDAÇÃO
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
              'O apelido deve ter pelo menos 2 caracteres.'
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
      // DESCOBRE TABELA
      // ======================================================

      const tabela =
        tipoConta ===
        'produtor'
          ? 'produtores'
          : 'usuarios';

      // ======================================================
      // VERIFICA SE A CONTA EXISTE
      // ======================================================

      const contaResult =
        await db.query(
          `
            SELECT
              id,
              nome,
              email,
              apelido,
              avatar,
              bio,
              role

            FROM public.${tabela}

            WHERE id = $1

            LIMIT 1
          `,
          [userId]
        );

      if (
        contaResult.rows.length ===
        0
      ) {
        console.error(
          '❌ Conta não encontrada:',
          {
            userId,
            tabela
          }
        );

        return res
          .status(404)
          .json({
            error:
              'Conta não encontrada.'
          });
      }

      // ======================================================
      // CLOUDINARY
      // ======================================================

      console.log(
        '☁️ Enviando avatar para Cloudinary...'
      );

      let uploadResult;

      try {
        uploadResult =
          await uploadBufferToCloudinary(
            req.file.buffer,
            userId,
            tipoConta
          );
      } catch (error) {
        console.error(
          '❌ Erro upload Cloudinary:',
          error
        );

        return res
          .status(500)
          .json({
            error:
              'Erro ao enviar foto de perfil.'
          });
      }

      const avatarUrl =
        uploadResult?.secure_url;

      if (!avatarUrl) {
        return res
          .status(500)
          .json({
            error:
              'Cloudinary não retornou a URL da imagem.'
          });
      }

      console.log(
        '✅ Avatar Cloudinary:',
        avatarUrl
      );

      // ======================================================
      // ATUALIZA PERFIL
      // ======================================================

      const userResult =
        await db.query(
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

      if (
        userResult.rows.length ===
        0
      ) {
        return res
          .status(500)
          .json({
            error:
              'Não foi possível atualizar o perfil.'
          });
      }

      const user =
        userResult.rows[0];

      console.log(
        '✅ Perfil atualizado:',
        {
          id: user.id,
          apelido:
            user.apelido,
          avatar:
            user.avatar
        }
      );

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
        await db.query(
          queryString,
          values
        );

      console.log(
        '✅ Onboarding salvo:',
        {
          userId,
          tipoConta,
          cidade
        }
      );

      // ======================================================
      // RESPOSTA
      // ======================================================

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
      console.error(
        '❌ ERRO SALVAR ONBOARDING:',
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
      // CIDADE DO USUÁRIO
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

      console.log(
        '🔎 Buscando matches:',
        {
          userId,
          tipoConta,
          cidade
        }
      );

      // ======================================================
      // MATCHES
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

      const matches =
        matchesResult.rows.map(
          (match) => ({
            ...match,

            display_name:
              match.apelido ||
              match.nome ||
              'Membro Linkah'
          })
        );

      console.log(
        `✅ ${matches.length} matches encontrados.`
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
        '❌ ERRO BUSCAR MATCHES:',
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