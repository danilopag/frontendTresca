// pages/api/map_tables/index.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // GET /api/map_tables?plan=XYZ
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { plan } = req.query;
            const [rows] = await db.query(
                'SELECT * FROM map_tables WHERE id_user = ? AND plan = ?',
                [tokenData.id, plan]
            );
            return res.status(200).json(rows);
        } catch (error) {
            console.error('Errore durante il recupero dei tavoli sulla mappa:', error);
            return res.status(500).json({ error: error.message });
        }
    })

    // POST /api/map_tables
    .post(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { table_name, table_type, plan, x, y, rotation, id_table } = req.body;

            await db.query(`
        INSERT INTO map_tables
          (table_name, table_type, plan, x, y, rotation, id_table, id_user)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                table_name, table_type, plan, x, y, rotation, id_table, tokenData.id
            ]);

            return res.status(201).json({ message: 'Tavolo aggiunto alla mappa con successo' });
        } catch (error) {
            console.error('Errore durante l\'aggiunta del tavolo alla mappa:', error);
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
