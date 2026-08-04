import db from '../config/database.js';

export const salvarRespostasOnboarding = async (req, res) => {
  try {
    const userId = req.usuarioId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { cidade, setor, generoFilme, personalidade, qualidades } = req.body;

    const queryString = `
      INSERT INTO user_preferences (user_id, cidade, setor, genero_filme, personalidade, qualidades, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET cidade = $2, setor = $3, genero_filme = $4, personalidade = $5, qualidades = $6, updated_at = NOW()
      RETURNING *;
    `;

    const values = [userId, cidade, setor, generoFilme, personalidade, JSON.stringify(qualidades)];
    const result = await db.query(queryString, values);

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar onboarding:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar preferências.' });
  }
};

export const buscarMatches = async (req, res) => {
  try {
    const userId = req.usuarioId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    // Busca a cidade do próprio usuário logado
    const minhaCidade = await db.query(
      `SELECT cidade FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
    const cidade = minhaCidade.rows[0]?.cidade || null;

    if (!cidade) {
      // usuário ainda não fez onboarding
      return res.status(400).json({ error: 'Onboarding não concluído.' });
    }

    const queryMatches = `
      SELECT up.*, u.nome, u.email 
      FROM user_preferences up
      JOIN usuarios u ON u.id = up.user_id
      WHERE up.user_id != $1 AND up.cidade = $2
      LIMIT 10
    `;

    const matches = await db.query(queryMatches, [userId, cidade]);

    return res.status(200).json({ success: true, matches: matches.rows, cidade });
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    return res.status(500).json({ error: 'Erro ao buscar conexões.' });
  }
};