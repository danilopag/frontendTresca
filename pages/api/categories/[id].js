// pages/api/categories/[id].js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // PUT /api/categories/:id
    .put(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query; // Parametro :id
            const { name_categories } = req.body;

            // Verifichiamo che la categoria appartenga a quest'utente
            const [existing] = await db.query(
                'SELECT * FROM categories WHERE id_category = ? AND id_user = ?',
                [id, tokenData.id]
            );
            if (existing.length === 0) {
                return res.status(404).json({ message: 'Categoria non trovata' });
            }

            // Aggiorna
            await db.query(
                'UPDATE categories SET name_categories = ? WHERE id_category = ? AND id_user = ?',
                [name_categories, id, tokenData.id]
            );
            return res.status(200).json({ message: 'Categoria aggiornata con successo' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    })

    // DELETE /api/categories/:id
    .delete(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id } = req.query;

            // Verifichiamo che la categoria appartenga a quest'utente
            const [existing] = await db.query(
                'SELECT * FROM categories WHERE id_category = ? AND id_user = ?',
                [id, tokenData.id]
            );
            if (existing.length === 0) {
                return res.status(404).json({ message: 'Categoria non trovata' });
            }

            await db.query(
                'DELETE FROM categories WHERE id_category = ? AND id_user = ?',
                [id, tokenData.id]
            );
            return res.status(200).json({ message: 'Categoria eliminata con successo' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
