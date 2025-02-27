// components/AlertModal.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Backdrop } from '@mui/material';
import { styled } from '@mui/system';

const BlurBackdrop = styled(Backdrop)(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
    backdropFilter: 'blur(5px)',
    color: '#fff',
}));

const AlertModal = ({ open, onClose, title, message }) => {
    return (
        <BlurBackdrop open={open} onClick={onClose}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '15px',
                        padding: '20px',
                        position: 'relative',
                    },
                }}
            >
                <DialogTitle>
                    <Typography variant="h5" align="center">
                        {title}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" align="center">
                        {message}
                    </Typography>
                </DialogContent>
                <DialogActions style={{ justifyContent: 'center' }}>
                    <Button onClick={onClose} variant="contained" color="primary">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </BlurBackdrop>
    );
};

export default AlertModal;
