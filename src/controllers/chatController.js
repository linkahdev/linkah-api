import db from '../config/database.js';

// Buscar mensagens entre o usuário logado e o usuário do match
export const buscarMensagens = async (req, res) => {
  try {
    const usuarioId = req.usuarioId; // Vindo do authMiddleware
    const { id: outroUsuarioId } = req.params; // ID do match

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const query = `
      SELECT * FROM mensagens_match
      WHERE (remetente_id = $1 AND destinatario_id = $2)
         OR (remetente_id = $2 AND destinatario_id = $1)
      ORDER BY created_at ASC
    `;

    const result = await db.query(query, [usuarioId, outroUsuarioId]);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar mensagens.' });
  }
};

// Enviar uma nova mensagem para o match
export const enviarMensagem = async (req, res) => {
  try {
    const remetenteId = req.usuarioId;
    const { destinatario_id, texto } = req.body;

    if (!remetenteId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!destinatario_id || !texto || !texto.trim()) {
      return res.status(400).json({ error: 'Destinatário e texto são obrigatórios.' });
    }

    const query = `
      INSERT INTO mensagens_match (remetente_id, destinatario_id, texto, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;

    const values = [remetenteId, destinatario_id, texto.trim()];
    const result = await db.query(query, values);

    return res.status(201).json({ success: true, mensagem: result.rows[0] });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({ error: 'Erro interno ao enviar mensagem.' });
  }
};