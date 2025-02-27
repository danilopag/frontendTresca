// components/withAuth.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const isTokenValid = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1])); // Decodifica il payload del JWT
        const currentTime = Math.floor(Date.now() / 1000); // Tempo corrente in secondi
        return payload.exp && payload.exp > currentTime ? payload : null; // Ritorna il payload se valido
    } catch (error) {
        return null; // Token non valido
    }
};

const withAuth = (WrappedComponent) => {
    const Wrapper = (props) => {
        const [loading, setLoading] = useState(true); // Stato di caricamento
        const router = useRouter();

        useEffect(() => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');

                if (!token) {
                    // Se non c'è token, reindirizza a /login
                    router.replace('/');
                    setLoading(false);
                    return;
                }

                const payload = isTokenValid(token);
                if (!payload) {
                    // Se il token non è valido, reindirizza a /login
                    router.replace('/');
                    setLoading(false);
                    return;
                }

                const currentPath = router.pathname;
                const allowedRoutes = payload.allowed_routes || []; // Autorizzazioni definite nel token
                console.log(currentPath, allowedRoutes);
                if (payload.is_admin === 1) {
                    // Se admin, reindirizza a /admin/dashboard
                    //router.replace('/admin/dashboard');
                    setLoading(false);
                } else if (!allowedRoutes.includes(currentPath)) {
                    // Se l'utente non ha accesso alla route attuale, reindirizza a /onePageEvent
                    router.replace(allowedRoutes[0]);
                    setLoading(false);
                } else {
                    // L'utente ha accesso: termina il caricamento
                    setLoading(false);
                }
            }
        }, [router]);

        if (loading) {
            return <div style={{ textAlign: 'center', marginTop: '50px' }}>Caricamento...</div>;
        }

        return <WrappedComponent {...props} />;
    };

    return Wrapper;
};

export default withAuth;
