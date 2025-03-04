// pages/api/table_layout/round/drop/[id_guest].js
import { createHandler } from '../../../../../utils/nc';
import db from '../../../../../utils/db';
import { authenticateToken } from '../../../../../utils/auth';

const handler = createHandler()
    // DELETE /api/table_layout/round/drop/:id_guest
    .delete(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { id_guest } = req.query;
            const {
                plan,
                id_table,
                new_id_table,
                table_order,
                table_side_position,
                new_table_side_position
            } = req.query;

            if (!plan) {
                return res.status(400).json({ error: 'Il parametro "plan" è richiesto' });
            }

            // Controllo proprietario
            const [guest] = await db.query('SELECT id_user FROM guests WHERE id_guest = ?', [id_guest]);
            if (!guest.length || guest[0].id_user !== tokenData.id) {
                return res.status(403).json({ error: 'Accesso negato' });
            }

            // Info assegnazione
            const [assignment] = await db.query(`
        SELECT *
        FROM table_layouts
        WHERE id_table = ? AND table_side_position = ? AND plan = ?
      `, [new_id_table, new_table_side_position, plan]);

            if (!assignment.length) {
                // Elimina
                await db.query(`
          DELETE FROM table_layouts
          WHERE id_guest = ? AND plan = ?
        `, [id_guest, plan]);

                return res.status(200).json({ message: 'Assegnazione eliminata' });
            } else {
                // Se i tavoli differiscono:
                if (id_table != new_id_table) {
                    await db.query(`
            UPDATE table_layouts
            SET id_table = ?, table_order = ?, table_side_position = ?
            WHERE id_guest = ? AND id_table = ? AND plan = ?
          `, [id_table, table_order, table_side_position, assignment[0].id_guest, new_id_table, plan]);
                } else {
                    // Stesso tavolo, aggiorniamo solo la side_position
                    await db.query(`
            UPDATE table_layouts
            SET table_side_position = ?
            WHERE id_guest = ? AND id_table = ? AND plan = ?
          `, [table_side_position, assignment[0].id_guest, id_table, plan]);
                }

                // Elimina
                await db.query(`
          DELETE FROM table_layouts
          WHERE id_guest = ? AND plan = ?
        `, [id_guest, plan]);

                return res.status(200).json({ message: 'Assegnazione eliminata' });
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
