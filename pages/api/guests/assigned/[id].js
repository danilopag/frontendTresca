// pages/api/guests/assigned/[id].js
import { createHandler } from '../../../../utils/nc';
import db from '../../../../utils/db';
import { authenticateToken } from '../../../../utils/auth';

const handler = createHandler()
    // GET /api/guests/assigned/:id?plan=xxx
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;   // id_table
            const { plan } = req.query;

            if (!plan) {
                return res.status(400).json({ error: 'Il parametro "plan" è richiesto' });
            }

            const [assignedGuests] = await db.query(`
        SELECT G.*, T.id_table, T.table_order, T.table_side_position
        FROM guests G
        INNER JOIN table_layouts T ON G.id_guest = T.id_guest
        INNER JOIN user_tables U ON T.id_table = U.id_table
        WHERE T.id_table = ? AND T.plan = ? AND U.id_user = ?
        ORDER BY T.table_order, T.table_side_position
      `, [id, plan, tokenData.id]);

            const intoleranceKeys = [
                'baby', 'vegetarian', 'vegan', 'gluten_free',
                'pregnant', 'lactose_free', 'other',
            ];
            const guestsWithIntolerances = assignedGuests.map(guest => {
                const intolerances = intoleranceKeys.filter(key => guest[key]);
                return { ...guest, intolerances };
            });

            return res.status(200).json(guestsWithIntolerances);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
