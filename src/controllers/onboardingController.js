import db from '../config/database.js';

function normalizarTipoConta(role) {
  return role === 'produtor' ? 'produtor' : 'usuario';
}

export const salvarRespostasOnboarding = async (req, res) => {
  try {
    const userId = req.usuarioId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const tipoConta = normalizarTipoConta(req.usuarioRole);
    const { cidade, setor, generoFilme, personalidade, qualidades } = req.body;

    const queryString = `
      INSERT INTO user_preferences (user_id, tipo_conta, cidade, setor, genero_filme, personalidade, qualidades, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id, tipo_conta) 
      DO UPDATE SET cidade = $3, setor = $4, genero_filme = $5, personalidade = $6, qualidades = $7, updated_at = NOW()
      RETURNING *;
    `;

    const values = [userId, tipoConta, cidade, setor, generoFilme, personalidade, JSON.stringify(qualidades)];
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

    const tipoConta = normalizarTipoConta(req.usuarioRole);

    const minhaCidade = await db.query(
      `SELECT cidade FROM user_preferences WHERE user_id = $1 AND tipo_conta = $2`,
      [userId, tipoConta]
    );
    const cidade = minhaCidade.rows[0]?.cidade || null;

    if (!cidade) {
      return res.status(400).json({ error: 'Onboarding não concluído.' });
    }

    const queryMatches = `
      SELECT 
        up.*, 
        COALESCE(u.nome, p.nome) AS nome, 
        COALESCE(u.email, p.email) AS email
      FROM user_preferences up
      LEFT JOIN usuarios u ON u.id = up.user_id AND up.tipo_conta = 'usuario'
      LEFT JOIN produtores p ON p.id = up.user_id AND up.tipo_conta = 'produtor'
      WHERE NOT (up.user_id = $1 AND up.tipo_conta = $2)
        AND up.cidade = $3
      LIMIT 10
    `;

    const matches = await db.query(queryMatches, [userId, tipoConta, cidade]);

    return res.status(200).json({ success: true, matches: matches.rows, cidade });
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    return res.status(500).json({ error: 'Erro ao buscar conexões.' });
  }
};