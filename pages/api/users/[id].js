// pages/api/users/[id].js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken, authorizeAdmin } from '../../../utils/auth';
import bcrypt from 'bcryptjs';

const handler = createHandler()
    // GET /api/users/:id
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { id } = req.query;
            const [users] = await db.query(
                'SELECT * FROM users WHERE id_user = ?',
                [id]
            );
            if (users.length === 0) {
                return res.status(404).json({ error: 'Utente non trovato' });
            }
            return res.status(200).json(users[0]);
        } catch (error) {
            console.error('Errore nel recupero dell\'utente:', error);
            return res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
        }
    })

    // PUT /api/users/:id
    .put(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { id } = req.query;
            const {
                nomeutente,
                event_name,
                event_date,
                email,
                password,
                is_admin,
                lockEdit
            } = req.body;

            // Controlla se l'utente esiste
            const [existingUsers] = await db.query(`
        SELECT * FROM users
        WHERE id_user = ?
      `, [id]);
            if (existingUsers.length === 0) {
                return res.status(404).json({ error: 'Utente non trovato' });
            }

            // Prepara i campi da aggiornare
            const fields = [];
            const values = [];

            if (nomeutente) {
                fields.push('nomeutente = ?');
                values.push(nomeutente);
            }
            if (event_name) {
                fields.push('event_name = ?');
                values.push(event_name);
            }
            if (event_date) {
                fields.push('event_date = ?');
                values.push(event_date);
            }
            if (email) {
                fields.push('email = ?');
                values.push(email);
            }
            if (typeof is_admin !== 'undefined') {
                fields.push('is_admin = ?');
                values.push(is_admin ? 1 : 0);
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                fields.push('password = ?');
                values.push(hashedPassword);
            }
            if (lockEdit) {
                // In base al tuo code: fields.push('lockEdit = ?'); toggling
                const newLockEdit = existingUsers[0].lockEdit ? 0 : 1;
                fields.push('lockEdit = ?');
                values.push(newLockEdit);
            }

            if (fields.length === 0) {
                return res.status(400).json({ error: 'Nessun campo da aggiornare' });
            }

            values.push(id);

            await db.query(`
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id_user = ?
      `, values);

            return res.status(200).json({ message: 'Utente aggiornato con successo' });
        } catch (error) {
            console.error('Errore nell\'aggiornamento dell\'utente:', error);
            return res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'utente' });
        }
    })

    // DELETE /api/users/:id
    .delete(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            authorizeAdmin(tokenData);

            const { id } = req.query;
            // Controlla se l'utente esiste
            const [existingUsers] = await db.query(`
        SELECT id_user FROM users
        WHERE id_user = ?
      `, [id]);

            if (existingUsers.length === 0) {
                return res.status(404).json({ error: 'Utente non trovato' });
            }

            // Elimina l'utente
            await db.query(`
        DELETE FROM users
        WHERE id_user = ?
      `, [id]);

            return res.status(200).json({ message: 'Utente eliminato con successo' });
        } catch (error) {
            console.error('Errore nell\'eliminazione dell\'utente:', error);
            return res.status(500).json({ error: 'Errore nell\'eliminazione dell\'utente' });
        }
    });

export default handler;
