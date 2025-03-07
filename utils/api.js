/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
     //baseURL: 'https://backendtresca-production.up.railway.app/api'
 */
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
