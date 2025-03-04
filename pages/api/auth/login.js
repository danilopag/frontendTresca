import { createHandler } from '../../../utils/nc';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../../utils/db';

const handler = createHandler()
    .use(
        body('email').isEmail().withMessage('Devi inserire un\'email valida.'),
        body('password').notEmpty().withMessage('La password è obbligatoria.')
    )
    .post(async (req, res) => {
        // Validazione
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(400).json({ message: 'Credenziali non valide' });
            }

            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Credenziali non valide' });
            }

            // Genera token
            const token = jwt.sign({
                id: user.id_user,
                is_admin: user.is_admin,
                allowed_routes: user.is_admin === 1
                    ? ["/admin/dashboard", "/admin/mapPreview"]
                    : (user.lockEdit
                        ? ["/onePageEventReadOnly"]
                        : ["/onePageEvent"])
            }, process.env.JWT_SECRET, { expiresIn: '8h' });

            return res.json({
                token,
                user: {
                    id: user.id_user,
                    name: user.nomeutente,
                    email: user.email,
                    event_name: user.event_name,
                    event_date: user.event_date,
                    is_admin: user.is_admin,
                    lockEdit: user.lockEdit
                }
            });
        } catch (error) {
            console.error('Errore durante il login:', error);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
    });

export default handler;
