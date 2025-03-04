// lib/nc.js
import nc from 'next-connect';
import cors from 'cors';
import helmet from 'helmet';

const allowedOrigins = [process.env.ALLOWED_ORIGIN];

function customCors() {
    return cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = 'La politica CORS non permette accesso da questo origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
    });
}

export function createHandler() {
    return nc({
        onError(error, req, res) {
            console.error('API Error:', error.stack);
            if (process.env.NODE_ENV === 'production') {
                res.status(500).json({ error: 'Errore interno del server' });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    })
        .use(customCors())
        .use(helmet())
        .use((req, res, next) => {
            // Emula express.json() in next (anche se Next in dev fa parse del JSON, ma per sicurezza)
            if (req.method !== 'GET') {
                // Se preferisci, potresti fare un check content-type
            }
            next();
        });
}
