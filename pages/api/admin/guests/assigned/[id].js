import { createHandler } from '../../../../../utils/nc';
import db from '../../../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../../../utils/auth';

const handler = createHandler()
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { id } = req.query; // corrisponde a :id
            const { id_user_table, plan } = req.query;

            if (!id_user_table && !plan) {
                return res.status(400).json({ error: 'Il parametro "user" / "plan" è richiesto' });
            }

            const [assignedGuests] = await db.query(`
        SELECT G.*, T.id_table, T.table_order, T.table_side_position
        FROM guests G
        INNER JOIN table_layouts T ON G.id_guest = T.id_guest
        INNER JOIN user_tables U ON T.id_table = U.id_table
        WHERE T.id_table = ? AND T.plan = ? AND U.id_user = ?
      `, [id, plan, id_user_table]);

            const intoleranceKeys = [
                'baby',
                'vegetarian',
                'vegan',
                'gluten_free',
                'pregnant',
                'lactose_free',
                'other',
            ];

            const guestsWithIntolerances = assignedGuests.map(guest => {
                const intolerances = intoleranceKeys.filter(key => guest[key]);
                return {
                    ...guest,
                    intolerances,
                };
            });

            return res.status(200).json(guestsWithIntolerances);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
