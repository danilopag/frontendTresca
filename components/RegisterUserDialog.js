/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../utils/api';

const RegisterUserDialog = ({ open, onClose, onUserRegistered }) => {
    const [userData, setUserData] = useState({
        nomeutente: '',
        email: '',
        password: '',
        event_name: '',
        event_date: '',
    });
    const [errorMessage, setErrorMessage] = useState('');

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const handleRegister = async () => {
        // Validazione dei campi
        if (
            !userData.nomeutente ||
            !userData.email ||
            !userData.password ||
            !userData.event_name ||
            !userData.event_date
        ) {
            setErrorMessage('Per favore, compila tutti i campi.');
            return;
        }

        try {
            await api.post('/users', { ...userData, is_admin: false });
            setErrorMessage('');
            setUserData({
                nomeutente: '',
                email: '',
                password: '',
                event_name: '',
                event_date: '',
            });
            onClose();
            if (onUserRegistered) {
                onUserRegistered();
            }
        } catch (error) {
            console.error("Errore nella registrazione dell'utente:", error);
            setErrorMessage(
                "Errore nella registrazione dell'utente. Per favore, riprova."
            );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen}
        >
            <DialogTitle>
                Registra Nuovo Utente
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ padding: 2 }}>
                    {errorMessage && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}
                    <TextField
                        label="Nome Utente"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={userData.nomeutente}
                        onChange={(e) =>
                            setUserData({ ...userData, nomeutente: e.target.value })
                        }
                    />
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={userData.email}
                        onChange={(e) =>
                            setUserData({ ...userData, email: e.target.value })
                        }
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={userData.password}
                        onChange={(e) =>
                            setUserData({ ...userData, password: e.target.value })
                        }
                    />
                    <TextField
                        label="Nome Evento"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={userData.event_name}
                        onChange={(e) =>
                            setUserData({ ...userData, event_name: e.target.value })
                        }
                    />
                    <TextField
                        label="Data Evento"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        sx={{ mb: 2 }}
                        value={userData.event_date}
                        onChange={(e) =>
                            setUserData({ ...userData, event_date: e.target.value })
                        }
                    />
                    <Button
                        variant="contained"
                        onClick={handleRegister}
                        sx={{
                            backgroundColor: '#788c3c',
                            color: 'white',
                            ':hover': {
                                backgroundColor: '#657a33',
                            },
                        }}
                        fullWidth
                    >
                        Registra Utente
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterUserDialog;
