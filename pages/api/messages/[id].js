// pages/api/message/[id].js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // DELETE /api/message/:id
    .delete(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;

            const [result] = await db.query(`
        DELETE FROM messages
        WHERE id_message = ?
          AND (id_user = ? OR id_admin = ?)
      `, [id, tokenData.id, tokenData.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Messaggio non trovato o non autorizzato' });
            }

            return res.status(200).json({ message: 'Messaggio eliminato con successo' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
