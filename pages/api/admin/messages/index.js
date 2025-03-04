import { createHandler } from '../../../../utils/nc';
import db from '../../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../../utils/auth';

const handler = createHandler()
    .post(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { text_message, id_user } = req.body;
            await db.query(
                'INSERT INTO messages (text_message, data, id_user, id_admin) VALUES (?, NOW(), ?, ?)',
                [text_message, id_user, tokenData.id]
            );
            return res.status(201).json({ message: 'Messaggio inviato' });
        } catch (error) {
            console.error('Errore nell\'invio del messaggio:', error);
            return res.status(500).json({ error: 'Errore nell\'invio del messaggio' });
        }
    });

export default handler;
