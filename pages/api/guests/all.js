// pages/api/guests/all.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // GET /api/guests/all?plan=XXX
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { plan } = req.query;
            if (!plan) {
                return res.status(400).json({ error: 'Il parametro "plan" è richiesto' });
            }

            const [guests] = await db.query(`
        SELECT G.*, T.id_table, T.table_order, T.table_side_position, UT.table_name
        FROM guests G
        LEFT JOIN (
          SELECT TL.id_guest, TL.id_table, TL.table_order, TL.table_side_position
          FROM table_layouts TL
          WHERE TL.plan = ?
        ) T ON G.id_guest = T.id_guest
        LEFT JOIN user_tables UT ON T.id_table = UT.id_table AND UT.id_user = ?
        WHERE G.id_user = ?
      `, [plan, tokenData.id, tokenData.id]);

            const intoleranceKeys = [
                'baby', 'vegetarian', 'vegan', 'gluten_free',
                'pregnant', 'lactose_free', 'other',
            ];
            const guestsWithIntolerances = guests.map(guest => {
                const intolerances = intoleranceKeys.filter(key => guest[key]);
                // Rimuovi i campi booleans e sostituiscili con l'array
                intoleranceKeys.forEach(key => delete guest[key]);
                return { ...guest, intolerances };
            });

            return res.status(200).json(guestsWithIntolerances);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
