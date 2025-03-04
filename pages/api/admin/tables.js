import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../utils/auth';

const handler = createHandler()
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { id_user, plan } = req.query;
            if (!plan) {
                return res.status(400).json({ error: 'Il parametro "plan" è richiesto' });
            }
            if (!id_user) {
                return res.status(400).json({ error: 'Il parametro "id_user" è richiesto' });
            }

            const [tables] = await db.query(
                'SELECT * FROM user_tables WHERE id_user = ? AND plan = ?',
                [id_user, plan]
            );
            return res.status(200).json(tables);
        } catch (error) {
            console.error('Errore durante il recupero dei tavoli:', error);
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
