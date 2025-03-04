// pages/api/categories/index.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // GET /api/categories
    .get(async (req, res) => {
        try {
            // Leggiamo il token e ricaviamo l'utente
            const tokenData = authenticateToken(req, res);

            // Ricerca categorie in base a tokenData.id (user.id)
            const [categories] = await db.query(
                'SELECT * FROM categories WHERE id_user = ?',
                [tokenData.id]
            );
            return res.status(200).json(categories);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    })

    // POST /api/categories
    .post(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { name_categories } = req.body;

            await db.query(
                'INSERT INTO categories (name_categories, id_user) VALUES (?, ?)',
                [name_categories, tokenData.id]
            );
            return res.status(201).json({ message: 'Categoria aggiunta con successo' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
