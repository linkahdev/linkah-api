import db from '../config/database.js';

export const salvarRespostasOnboarding = async (req, res) => {
  try {
    const userId = req.usuarioId; 
    const { cidade, setor, generoFilme, personalidade, qualidades } = req.body;

    const queryString = `
      INSERT INTO user_preferences (user_id, cidade, setor, genero_filme, personalidade, qualidades, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET cidade = $2, setor = $3, genero_filme = $4, personalidade = $5, qualidades = $6, updated_at = NOW()
      RETURNING *;
    `;
    
    const values = [userId, cidade, setor, generoFilme, personalidade, JSON.stringify(qualidades)];
    
    // Altere de 'query(...)' para 'db.query(...)'
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

    const queryMatches = `
      SELECT up.*, u.nome, u.email 
      FROM user_preferences up
      JOIN usuarios u ON u.id = up.user_id
      WHERE up.user_id != $1 
      LIMIT 10
    `;
    
    // Altere de 'query(...)' para 'db.query(...)'
    const matches = await db.query(queryMatches, [userId]);

    return res.status(200).json({ success: true, matches: matches.rows });
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    return res.status(500).json({ error: 'Erro ao buscar conexões.' });
  }
};