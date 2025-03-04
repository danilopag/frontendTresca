// pages/api/table/index.js
import { createHandler } from '../../../utils/nc';
import db from '../../../utils/db';
import { authenticateToken } from '../../../utils/auth';

const handler = createHandler()
    // GET /api/table?plan=XYZ
    .get(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { plan } = req.query;

            const [tables] = await db.query(
                'SELECT * FROM user_tables WHERE id_user = ? AND plan = ?',
                [tokenData.id, plan]
            );
            return res.status(200).json(tables);
        } catch (error) {
            console.error('Errore durante il recupero dei tavoli:', error);
            return res.status(500).json({ error: error.message });
        }
    })

    // POST /api/table
    .post(async (req, res) => {
        try {
            const tokenData = authenticateToken(req, res);
            const { table_name, table_type, order_table, plan, vertical } = req.body;

            const [result] = await db.query(`
        INSERT INTO user_tables
          (table_name, table_type, order_table, plan, vertical, id_user)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [table_name, table_type, order_table, plan, vertical, tokenData.id]);

            const newTableId = result.insertId;

            return res.status(201).json({
                id_table: newTableId,
                table_name,
                table_type,
                order_table,
                plan,
                vertical
            });
        } catch (error) {
            console.error('Errore durante l\'aggiunta del tavolo:', error);
            return res.status(500).json({ error: error.message });
        }
    });

export default handler;
