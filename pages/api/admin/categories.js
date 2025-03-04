import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../utils/auth';

const handler = createHandler()
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { userId } = req.query;
            const [categories] = await db.query(
                'SELECT * FROM categories WHERE id_user = ?',
                [userId]
            );
            return res.status(200).json(categories);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
