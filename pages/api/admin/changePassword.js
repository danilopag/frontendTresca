import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import bcrypt from 'bcryptjs';
import { authenticateToken, authorizeAdmin } from '../../../utils/auth';

const handler = createHandler()
    .post(async (req, res) => {
        const { currentPassword, newPassword } = req.body;

        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const [rows] = await db.query('SELECT * FROM users WHERE id_user = ?', [tokenData.id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Admin non trovato' });
            }

            const admin = rows[0];
            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Password attuale errata' });
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE users SET password = ? WHERE id_user = ?', [hashed, admin.id_user]);

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Errore cambio password admin:', error);
            return res.status(500).json({ message: 'Errore interno del server' });
        }
    });

export default handler;
