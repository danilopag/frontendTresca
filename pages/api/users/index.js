// pages/api/users/index.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../utils/auth';
import bcrypt from 'bcryptjs';

const handler = createHandler()
    // GET /api/users
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData); // Solo admin

            const [users] = await db.query(`
        SELECT * FROM users
        WHERE is_admin = 0
        ORDER BY event_date DESC
      `);
            return res.status(200).json(users);
        } catch (error) {
            console.error('Errore nel recupero degli utenti:', error);
            return res.status(500).json({ error: 'Errore nel recupero degli utenti' });
        }
    })

    // POST /api/users
    .post(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { nomeutente, email, password, is_admin, event_name, event_date } = req.body;

            if (!nomeutente || !email || !password || !event_name || !event_date) {
                return res.status(400).json({ error: 'Tutti i campi sono richiesti' });
            }

            // Controlla se l'email è già in uso
            const [existingUsers] = await db.query(`
        SELECT id_user
        FROM users
        WHERE email = ?
      `, [email]);
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Email già in uso' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            await db.query(`
        INSERT INTO users (nomeutente, email, password, is_admin, event_name, event_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
                nomeutente,
                email,
                hashedPassword,
                is_admin ? 1 : 0,
                event_name,
                event_date
            ]);

            return res.status(201).json({ message: 'Utente creato con successo' });
        } catch (error) {
            console.error('Errore nella creazione dell\'utente:', error);
            return res.status(500).json({ error: 'Errore nella creazione dell\'utente' });
        }
    });

export default handler;
