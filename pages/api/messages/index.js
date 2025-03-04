// pages/api/message/index.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';

const handler = createHandler()
    // GET /api/message?id_user=xxx
    .get(async (req, res) => {
        try {
            const { id_user } = req.query;
            const [rows] = await db.query(
                'SELECT * FROM messages WHERE id_user = ? ORDER BY data ASC',
                [id_user]
            );
            return res.json(rows);
        } catch (error) {
            console.error('Errore nel recupero dei messaggi:', error);
            return res.status(500).send('Errore nel recupero dei messaggi');
        }
    })

    // POST /api/message
    .post(async (req, res) => {
        try {
            const { text_message, id_user, id_admin } = req.body;
            await db.query(
                'INSERT INTO messages (text_message, data, id_user, id_admin) VALUES (?, NOW(), ?, ?)',
                [text_message, id_user, id_admin]
            );
            return res.status(201).send('Messaggio inviato');
        } catch (error) {
            console.error('Errore nell\'invio del messaggio:', error);
            return res.status(500).send('Errore nell\'invio del messaggio');
        }
    });

export default handler;
