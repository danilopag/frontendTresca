// pages/api/table/[id].js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // PUT /api/table/:id
    .put(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;
            const { table_name } = req.body;

            const [result] = await db.query(`
        UPDATE user_tables
        SET table_name = ?
        WHERE id_table = ? AND id_user = ?
      `, [table_name, id, tokenData.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Tavolo non trovato o non autorizzato' });
            }

            return res.status(200).json({ message: 'Tavolo aggiornato con successo' });
        } catch (error) {
            console.error('Errore durante l\'aggiornamento del tavolo:', error);
            return res.status(500).json({ error: error.message });
        }
    })

    // DELETE /api/table/:id
    .delete(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;

            const [result] = await db.query(`
        DELETE FROM user_tables
        WHERE id_table = ?
          AND id_user = ?
      `, [id, tokenData.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Tavolo non trovato o non autorizzato' });
            }

            // Rimuovi l'assegnazione degli invitati a questo tavolo
            await db.query(`
        DELETE FROM table_layouts
        WHERE id_table = ?
      `, [id]);

            return res.status(200).json({ message: 'Tavolo eliminato con successo' });
        } catch (error) {
            console.error('Errore durante l\'eliminazione del tavolo:', error);
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
