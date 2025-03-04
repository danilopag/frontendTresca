import { createHandler } from '../../../../../utils/nc';
import db from '../../../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../../../utils/auth';

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

            const [rows] = await db.query(`
        SELECT COUNT(*) AS count FROM guests
        WHERE id_guest NOT IN (
          SELECT T.id_guest FROM user_tables U
          INNER JOIN table_layouts T ON U.id_table = T.id_table
          WHERE T.plan = ? AND U.id_user = ?
        ) AND id_user = ?
      `, [plan, id_user, id_user]);

            const count = rows[0]?.count || 0;
            return res.status(200).json({ count });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
