// pages/api/table_layout/rect/drop/change.js
import { createHandler } from '../../../../../utils/nc';
import db from '../../../../../utils/db';
import { authenticateToken } from '../../../../../utils/auth';

const handler = createHandler()
    // PUT /api/table_layout/rect/drop/change
    .put(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const {
                id_guest,
                id_table,
                table_order,
                table_side_position,
                plan,
            } = req.body;

            if (!plan) {
                return res.status(400).json({ error: 'Il parametro "plan" è richiesto' });
            }

            // Controllo proprietario
            const [guest] = await db.query('SELECT id_user FROM guests WHERE id_guest = ?', [id_guest]);
            if (!guest.length || guest[0].id_user !== tokenData.id) {
                return res.status(403).json({ error: 'Accesso negato' });
            }

            await db.query(`
        UPDATE table_layouts
        SET id_table = ?, table_order = ?, table_side_position = ?
        WHERE id_guest = ? AND plan = ?
      `, [id_table, table_order, table_side_position, id_guest, plan]);

            return res.status(200).json({ message: 'Assegnazione eliminata e posizioni aggiornate' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
