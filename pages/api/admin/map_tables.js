import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id_user, plan } = req.query;
            const [rows] = await db.query(
                'SELECT * FROM map_tables WHERE id_user = ? AND plan = ?',
                [id_user, plan]
            );
            return res.status(200).json(rows);
        } catch (error) {
            console.error('Errore durante il recupero dei tavoli sulla mappa:', error);
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
