// pages/api/map_tables/[id].js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // PUT /api/map_tables/:id
    .put(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;

            const fields = [];
            const values = [];

            if (req.body.x !== undefined) {
                fields.push('x = ?');
                values.push(req.body.x);
            }
            if (req.body.y !== undefined) {
                fields.push('y = ?');
                values.push(req.body.y);
            }
            if (req.body.rotation !== undefined) {
                fields.push('rotation = ?');
                values.push(req.body.rotation);
            }

            if (fields.length === 0) {
                return res.status(400).json({ message: 'Nessun campo da aggiornare' });
            }

            values.push(id, tokenData.id);

            const [result] = await db.query(
                `UPDATE map_tables
         SET ${fields.join(', ')}
         WHERE id_map_table = ? AND id_user = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Tavolo sulla mappa non trovato o non autorizzato' });
            }

            return res.status(200).json({ message: 'Tavolo sulla mappa aggiornato con successo' });
        } catch (error) {
            console.error('Errore durante l\'aggiornamento del tavolo sulla mappa:', error);
            return res.status(500).json({ error: error.message });
        }
    })

    // DELETE /api/map_tables/:id
    .delete(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;

            const [result] = await db.query(
                'DELETE FROM map_tables WHERE id_map_table = ? AND id_user = ?',
                [id, tokenData.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Tavolo sulla mappa non trovato o non autorizzato' });
            }

            return res.status(200).json({ message: 'Tavolo sulla mappa eliminato con successo' });
        } catch (error) {
            console.error('Errore durante l\'eliminazione del tavolo sulla mappa:', error);
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
