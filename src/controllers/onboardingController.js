// src/controllers/onboardingController.js
import db from '../config/database.js'; // Ajuste conforme a sua conexão com o banco

export const salvarRespostasOnboarding = async (req, res) => {
  try {
    const userId = req.usuarioId; // Depende de como seu middleware de auth injeta o ID
    const { cidade, setor, generoFilme, personalidade, qualidades } = req.body;

    // Exemplo salvando ou atualizando na tabela de preferências do usuário
    // (Ajuste a query de acordo com o driver de banco que você está usando, ex: Prisma, pg, mysql2)
    const query = `
      INSERT INTO user_preferences (user_id, cidade, setor, genero_filme, personalidade, qualidades, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET cidade = $2, setor = $3, genero_filme = $4, personalidade = $5, qualidades = $6, updated_at = NOW()
      RETURNING *;
    `;
    
    // Se estiver usando ORM (Prisma/Sequelize), substitua pelo método equivalente.
    const values = [userId, cidade, setor, generoFilme, personalidade, JSON.stringify(qualidades)];
    const result = await db.query(query, values);

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar onboarding:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar preferências.' });
  }
};

export const buscarMatches = async (req, res) => {
  try {
    const userId = req.usuarioId;

    // Busca usuários com preferências similares na mesma cidade
    // Aqui você pode personalizar a lógica de pontuação de compatibilidade
    const queryMatches = `
      up.*, u.nome, u.email 
      FROM user_preferences up
      JOIN usuarios u ON u.id = up.user_id
      WHERE up.user_id != $1 
      LIMIT 10
    `;
    
    const matches = await db.query(queryMatches, [userId]);

    return res.status(200).json({ success: true, matches: matches.rows });
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    return res.status(500).json({ error: 'Erro ao buscar conexões.' });
  }
};