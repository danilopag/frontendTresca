import { createHandler } from '../../../utils/nc';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import db from '../../../utils/db';

const handler = createHandler()
    .use(
        // Esempio di middleware express-validator
        body('name').trim().notEmpty().withMessage('Il nome è obbligatorio.'),
        body('email').isEmail().withMessage('Devi inserire un\'email valida.'),
        body('password').isLength({ min: 6 }).withMessage('La password deve avere almeno 6 caratteri.')
    )
    .post(async (req, res) => {
        // Validazione
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length > 0) {
                return res.status(400).json({ message: 'Email già in uso' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query('INSERT INTO users (nomeutente, email, password) VALUES (?, ?, ?)', [
                name,
                email,
                hashedPassword,
            ]);
            return res.status(201).json({ message: 'Utente registrato con successo' });
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            return res.status(500).json({ error: 'Errore interno del server' });
        }
    });

export default handler;
