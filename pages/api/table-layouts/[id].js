// pages/api/table_layout/[id].js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // PUT /api/table_layout/:id
    .put(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;
            const { id_guest, id_table, table_order, table_side_position, plan } = req.body;

            const [result] = await db.query(`
        UPDATE table_layouts
        SET id_guest = ?, id_table = ?, table_order = ?, table_side_position = ?, plan = ?
        WHERE id_layout = ?
      `, [id_guest, id_table, table_order, table_side_position, plan, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Disposizione non trovata o non autorizzata' });
            }

            return res.status(200).json({ message: 'Disposizione aggiornata con successo' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
