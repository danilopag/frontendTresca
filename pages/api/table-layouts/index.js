// pages/api/table_layout/index.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // GET /api/table_layout
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const [layouts] = await db.query(`
        SELECT tl.*, g.guest_name, t.table_name
        FROM table_layouts tl
        JOIN guests g ON tl.id_guest = g.id_guest
        JOIN map_tables t ON tl.id_table = t.id_table
        WHERE t.id_user = ?
      `, [tokenData.id]);
            return res.status(200).json(layouts);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    })

    // POST /api/table_layout
    .post(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id_guest, id_table, table_order, table_side_position, plan } = req.body;
            if (!id_guest || !id_table || table_order === undefined || table_side_position === undefined || !plan) {
                return res.status(400).json({ error: 'Parametri mancanti' });
            }

            // Verifica proprietà dell'utente
            const [guest] = await db.query('SELECT id_user FROM guests WHERE id_guest = ?', [id_guest]);
            const [table] = await db.query('SELECT id_user FROM user_tables WHERE id_table = ?', [id_table]);

            if (!guest.length || guest[0].id_user !== tokenData.id || !table.length || table[0].id_user !== tokenData.id) {
                return res.status(403).json({ error: 'Accesso negato' });
            }

            await db.query(`
        INSERT INTO table_layouts
          (id_guest, id_table, table_order, table_side_position, plan)
        VALUES (?, ?, ?, ?, ?)
      `, [id_guest, id_table, table_order, table_side_position, plan]);

            return res.status(201).json({ message: 'Invitato assegnato al tavolo' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
