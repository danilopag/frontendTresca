// pages/api/table_layout/round/[id_guest].js
import { createHandler } from '../../../../utils/nc';
import db from '../../../../utils/db';
import { authenticateToken } from '../../../../utils/auth';

const handler = createHandler()
    // DELETE /api/table_layout/round/:id_guest?plan=xxx
    .delete(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id_guest } = req.query;
            const { plan } = req.query;

            if (!plan) {
                return res.status(400).json({ error: 'Il parametro "plan" è richiesto' });
            }

            // Check proprietario
            const [guest] = await db.query('SELECT id_user FROM guests WHERE id_guest = ?', [id_guest]);
            if (!guest.length || guest[0].id_user !== tokenData.id) {
                return res.status(403).json({ error: 'Accesso negato' });
            }

            // Info assegnazione
            const [assignment] = await db.query(`
        SELECT id_table, table_order, table_side_position
        FROM table_layouts
        WHERE id_guest = ? AND plan = ?
      `, [id_guest, plan]);

            if (!assignment.length) {
                return res.status(200).json({ message: 'Nuova Assegnazione' });
            }

            // Elimina
            await db.query(`
        DELETE FROM table_layouts
        WHERE id_guest = ? AND plan = ?
      `, [id_guest, plan]);

            return res.status(200).json({ message: 'Assegnazione eliminata' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
