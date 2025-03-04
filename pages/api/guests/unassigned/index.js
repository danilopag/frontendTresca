// pages/api/guests/unassigned/index.js
import { createHandler } from '../../../../utils/nc';
import db from '../../../../utils/db';
import { authenticateToken } from '../../../../utils/auth';

const handler = createHandler()
    // GET /api/guests/unassigned?plan=XXX
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { plan } = req.query;
            if (!plan) {
                return res.status(400).json({ error: 'Il parametro "plan" è richiesto' });
            }

            const [unassignedGuests] = await db.query(`
        SELECT * FROM guests
        WHERE id_guest NOT IN (
          SELECT T.id_guest
          FROM user_tables U
          INNER JOIN table_layouts T ON U.id_table = T.id_table
          WHERE T.plan = ? AND U.id_user = ?
        )
        AND id_user = ?
      `, [plan, tokenData.id, tokenData.id]);

            const intoleranceKeys = [
                'baby', 'vegetarian', 'vegan', 'gluten_free',
                'pregnant', 'lactose_free', 'other',
            ];
            const guestsWithIntolerances = unassignedGuests.map(guest => {
                const intolerances = intoleranceKeys.filter(key => guest[key]);
                return { ...guest, intolerances };
            });

            return res.status(200).json(guestsWithIntolerances);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
