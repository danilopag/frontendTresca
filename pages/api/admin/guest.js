import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../utils/auth';

const handler = createHandler()
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { userId } = req.query;
            const [guests] = await db.query(
                'SELECT * FROM guests WHERE id_user = ? ORDER BY id_category, guest_name',
                [userId]
            );

            // Definisci le chiavi delle intolleranze
            const intoleranceKeys = [
                'baby',
                'vegetarian',
                'vegan',
                'gluten_free',
                'pregnant',
                'lactose_free',
                'other',
            ];

            const guestsWithIntolerances = guests.map(guest => {
                const intolerances = intoleranceKeys.filter(key => guest[key]);
                const {
                    id_guest,
                    guest_name,
                    other_text,
                    id_category,
                    id_user,
                } = guest;

                return {
                    id_guest,
                    guest_name,
                    intolerances,
                    other_text,
                    id_category,
                    id_user,
                };
            });

            return res.status(200).json(guestsWithIntolerances);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
