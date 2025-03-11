import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    Tooltip,
    IconButton,
    InputAdornment,
} from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LogoutIcon from '@mui/icons-material/Logout';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import api from '../utils/api';

function HeaderButtons() {
    const router = useRouter();
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changePasswordError, setChangePasswordError] = useState('');
    const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

    // Stati per la visibilità delle password
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Funzione per il logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/');
    };

    // Funzione per inviare la richiesta per cambiare la password
    const handleChangePasswordSubmit = async () => {
        // Controlla che la nuova password e la conferma coincidano
        if (newPassword !== confirmNewPassword) {
            setChangePasswordError('Le nuove password non coincidono.');
            return;
        }
        try {
            await api.post('/users/change-password', {
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmNewPassword: confirmNewPassword,
            });
            setChangePasswordSuccess('Password aggiornata con successo.');
            // Chiudi il dialogo dopo qualche secondo
            setTimeout(() => {
                setOpenChangePassword(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setChangePasswordError('');
                setChangePasswordSuccess('');
            }, 2000);
        } catch (error) {
            setChangePasswordError('Errore nella modifica della password.');
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
            <Tooltip title="Ritorna a Tresca.it">
                <IconButton
                    onClick={() => router.push('https://tresca.it')}
                    sx={{
                        backgroundColor: 'white',
                        color: '#788c3c',
                        ':hover': { backgroundColor: '#f0f0f0' },
                    }}
                >
                    <HomeIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Modifica Password">
                <IconButton
                    onClick={() => setOpenChangePassword(true)}
                    sx={{
                        backgroundColor: 'white',
                        color: 'primary.main',
                        ':hover': { backgroundColor: '#f0f0f0' },
                    }}
                >
                    <VpnKeyIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Logout">
                <IconButton
                    onClick={handleLogout}
                    sx={{
                        backgroundColor: 'white',
                        color: '#D70040',
                        ':hover': { backgroundColor: '#f0f0f0' },
                    }}
                >
                    <LogoutIcon />
                </IconButton>
            </Tooltip>

            {/* Dialog per la modifica della password */}
            <Dialog open={openChangePassword} onClose={() => setOpenChangePassword(false)}>
                <DialogTitle>Modifica Password</DialogTitle>
                <DialogContent>
                    {changePasswordError && (
                        <Box sx={{ color: 'red', mt: 1 }}>{changePasswordError}</Box>
                    )}
                    {changePasswordSuccess && (
                        <Box sx={{ color: 'green', mt: 1 }}>{changePasswordSuccess}</Box>
                    )}
                    <TextField
                        label="Vecchia Password"
                        type={showOldPassword ? 'text' : 'password'}
                        fullWidth
                        margin="normal"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                        edge="end"
                                    >
                                        {showOldPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        label="Nuova Password"
                        type={showNewPassword ? 'text' : 'password'}
                        fullWidth
                        margin="normal"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        edge="end"
                                    >
                                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <TextField
                        label="Rinserisci Nuova Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        fullWidth
                        margin="normal"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenChangePassword(false)}>Annulla</Button>
                    <Button variant="contained" onClick={handleChangePasswordSubmit}>
                        Salva
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default HeaderButtons;
