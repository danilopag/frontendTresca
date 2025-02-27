// components/ConfirmDialog.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';

const ConfirmDialog = ({ open, onClose, onConfirm, title, content }) => {
    return (
        <Dialog
            open={open}
            onClose={() => onClose()}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
        >
            {title && <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>}
            {content && (
                <DialogContent>
                    <DialogContentText id="confirm-dialog-description">
                        {content}
                    </DialogContentText>
                </DialogContent>
            )}
            <DialogActions>
                <Button onClick={() => onClose()} color="primary">
                    Annulla
                </Button>
                <Button onClick={() => onConfirm()} color="primary" variant="contained" autoFocus>
                    Conferma
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
