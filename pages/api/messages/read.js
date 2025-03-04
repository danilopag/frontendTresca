// pages/api/message/read.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';

const handler = createHandler()
    // PUT /api/message/read
    .put(async (req, res) => {
        try {
            const { id_user } = req.body;
            await db.query(
                'UPDATE messages SET read_message = 1 WHERE id_user = ? AND id_admin IS NOT NULL',
                [id_user]
            );
            return res.status(200).send('Messaggi marcati come letti');
        } catch (error) {
            console.error('Errore nel marcare i messaggi come letti:', error);
            return res.status(500).send('Errore nel marcare i messaggi come letti');
        }
    });

export default handler;
