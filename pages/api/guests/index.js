// pages/api/guests/index.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // GET /api/guests
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const [guests] = await db.query(
                'SELECT * FROM guests WHERE id_user = ? ORDER BY id_category, id_guest DESC',
                [tokenData.id]
            );

            const intoleranceKeys = [
                'baby', 'vegetarian', 'vegan', 'gluten_free',
                'pregnant', 'lactose_free', 'other',
            ];
            const guestsWithIntolerances = guests.map(guest => {
                const intolerances = intoleranceKeys.filter(key => guest[key]);
                return {
                    id_guest: guest.id_guest,
                    guest_name: guest.guest_name,
                    intolerances,
                    other_text: guest.other_text,
                    id_category: guest.id_category,
                    id_user: guest.id_user
                };
            });

            return res.status(200).json(guestsWithIntolerances);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    })

    // POST /api/guests
    .post(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);

            const { guest_name, id_category, intolerances, other_text } = req.body;
            let baby = false;
            let vegetarian = false;
            let vegan = false;
            let gluten_free = false;
            let pregnant = false;
            let lactose_free = false;
            let other = false;

            if (intolerances && Array.isArray(intolerances)) {
                baby = intolerances.includes('baby');
                vegetarian = intolerances.includes('vegetarian');
                vegan = intolerances.includes('vegan');
                gluten_free = intolerances.includes('gluten_free');
                pregnant = intolerances.includes('pregnant');
                lactose_free = intolerances.includes('lactose_free');
                other = intolerances.includes('other');
            }

            await db.query(`
        INSERT INTO guests (
          guest_name, baby, vegetarian, vegan, gluten_free,
          pregnant, lactose_free, other, other_text, id_category, id_user
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    guest_name,
                    baby,
                    vegetarian,
                    vegan,
                    gluten_free,
                    pregnant,
                    lactose_free,
                    other,
                    other_text,
                    id_category,
                    tokenData.id
                ]
            );
            return res.status(201).json({ message: 'Invitato aggiunto con successo' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
