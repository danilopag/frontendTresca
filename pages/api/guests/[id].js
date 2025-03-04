// pages/api/guests/[id].js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // PUT /api/guests/:id
    .put(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;

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

            const [result] = await db.query(`
        UPDATE guests
        SET
          guest_name = ?,
          baby = ?, vegetarian = ?, vegan = ?, gluten_free = ?,
          pregnant = ?, lactose_free = ?, other = ?,
          other_text = ?, id_category = ?
        WHERE id_guest = ? AND id_user = ?`,
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
                    id,
                    tokenData.id
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Invitato non trovato o non autorizzato' });
            }

            return res.json({ message: 'Invitato aggiornato con successo' });
        } catch (error) {
            console.error('Errore durante l\'aggiornamento dell\'invitato:', error);
            return res.status(500).json({ error: error.message });
        }
    })

    // DELETE /api/guests/:id
    .delete(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;

            const [existingGuests] = await db.query(
                'SELECT * FROM guests WHERE id_guest = ? AND id_user = ?',
                [id, tokenData.id]
            );
            if (existingGuests.length === 0) {
                return res.status(404).json({ message: 'Invitato non trovato' });
            }

            await db.query(
                'DELETE FROM guests WHERE id_guest = ? AND id_user = ?',
                [id, tokenData.id]
            );
            return res.status(200).json({ message: 'Invitato eliminato con successo' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
