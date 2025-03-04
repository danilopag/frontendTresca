// lib/auth.js
import jwt from 'jsonwebtoken';

export function authenticateToken(req, res) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        // Mandiamo 401 e fermiamo
        throw new Error('Accesso negato, token mancante');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new Error('Accesso negato, token mancante');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded; // restituiremo i dati del token
    } catch (error) {
        throw new Error('Token non valido');
    }
}

export function authorizeAdmin(user) {
    if (!user?.is_admin) {
        throw new Error('Accesso negato. Non sei un amministratore.');
    }
}
