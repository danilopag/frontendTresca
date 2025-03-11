/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListSubheader,
    Checkbox,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    ListItemSecondaryAction,
    IconButton,
} from '@mui/material';
import { ExpandMore, Close } from '@mui/icons-material';
import api from '../utils/api';

/**
 * AddSingleGuestRectDialog:
 * - Per tavoli rettangolari (o a S)
 * - Qui NON decidiamo la side_order, perché lo gestisce il parent (handleSeatFilled).
 * - Al “Conferma”, passiamo semplicemente l’ID invitato con `onConfirm()`.
 */
function AddSingleGuestRectDialog({
    open,
    onClose,
    onConfirm, // callback per restituire l’ID invitato scelto
    table,
    currentPlan,
}) {
    const [allGuests, setAllGuests] = useState([]);
    const [selectedGuests, setSelectedGuests] = useState([]);

    useEffect(() => {
        if (open) {
            fetchAllGuests();
        } else {
            // reset quando si chiude
            setAllGuests([]);
            setSelectedGuest([]);
        }
    }, [open]);

    const fetchAllGuests = async () => {
        try {
            const res = await api.get('/guests/all', {
                params: { plan: currentPlan },
            });
            setAllGuests(res.data);
        } catch (error) {
            console.error('Errore fetchAllGuests:', error);
        }
    };

    const handleClose = () => {
        onClose();
    };

    const handleGuestSelect = (id_guest) => {
        setSelectedGuests((prev) =>
            prev.includes(id_guest)
                ? prev.filter((id) => id !== id_guest)
                : [...prev, id_guest]
        );
    };

    const handleConfirm = () => {
        if (selectedGuests.length === 0) return;
        // Chiameremo onConfirm(selectedGuest)
        // Sarà il parent a fare la POST su /table-layouts con sideOrder / side_position
        onConfirm(selectedGuests);
    };

    // Suddividiamo i guests in non assegnati / assegnati
    const unassigned = allGuests.filter((g) => !g.id_table);
    const assigned = allGuests.filter((g) => g.id_table);

    // Raggruppa assegnati per tavolo
    const assignedMap = {};
    assigned.forEach((g) => {
        const name = g.table_name || `#${g.id_table}`;
        if (!assignedMap[name]) assignedMap[name] = [];
        assignedMap[name].push(g);
    });

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Aggiungi Invitati a {table.table_name}
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="subtitle2" gutterBottom>
                    Seleziona uno o più invitati
                </Typography>

                {/* Sezione Non Assegnati */}
                <ListSubheader disableSticky sx={{ color: 'black' }}>Non Assegnati</ListSubheader>
                <List dense>
                    {unassigned.map((guest) => {
                        const isSelected = selectedGuests.includes(guest.id_guest);
                        return (
                            <ListItem
                                key={guest.id_guest}
                                button
                                onClick={() => handleGuestSelect(guest.id_guest)}
                                selected={isSelected}
                            >
                                <ListItemText
                                    primary={guest.guest_name}
                                    secondary="Non assegnato"
                                />
                                <ListItemSecondaryAction>
                                    <Checkbox
                                        edge="end"
                                        checked={isSelected}
                                        onChange={() => handleGuestSelect(guest.id_guest)}
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })}
                </List>

                {/* Sezione “Assegnati” raggruppati per tavolo */}
                {Object.keys(assignedMap).map((groupKey) => (
                    <Accordion key={groupKey}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography>Tavolo {groupKey}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {assignedMap[groupKey]
                                    .slice() // copia l'array per non modificarlo direttamente
                                    .sort((a, b) => Number(a.table_side_position || 0) - Number(b.table_side_position || 0))
                                    .map((guest) => {
                                        const isSelected = selectedGuests.includes(guest.id_guest);
                                        return (
                                            <ListItem
                                                key={guest.id_guest}
                                                button
                                                onClick={() => handleGuestSelect(guest.id_guest)}
                                                selected={isSelected}
                                            >
                                                <ListItemText
                                                    primary={guest.guest_name}
                                                    secondary={`Posizione: ${guest.table_side_position || '-'}`}
                                                />
                                                <ListItemSecondaryAction>
                                                    <Checkbox
                                                        edge="end"
                                                        checked={isSelected}
                                                        onChange={() => handleGuestSelect(guest.id_guest)}
                                                    />
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        );
                                    })}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>Annulla</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={selectedGuests.length === 0}
                >
                    Aggiungi
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddSingleGuestRectDialog;
