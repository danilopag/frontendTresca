/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Assicurati che la porta corrisponda a quella del tuo backend
});

api.interceptors.request.use(
    (config) => {
        // Aggiungi il token JWT alle richieste se presente
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
