import { createHandler } from '../../../../utils/nc';
import db from '../../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../../utils/auth';

const handler = createHandler()
    .get(async (req, res) => {
        const { id_user } = req.query; // id_user è un parametro della route
        try {
            const tokenData = authenticateToken(req, res); // lancia error se token mancante o invalido
            authorizeAdmin(tokenData); // lancia error se non è admin

            const [messages] = await db.query(
                'SELECT * FROM messages WHERE id_user = ? ORDER BY data ASC',
                [id_user]
            );
            return res.json(messages);
        } catch (error) {
            console.error('Errore nel recupero dei messaggi:', error);
            return res.status(500).json({ error: 'Errore nel recupero dei messaggi' });
        }
    });

export default handler;
