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

function AddMultipleGuestRoundDialog({
    open,
    onClose,
    table,                  // es. { id_table, table_name, ... }
    seatIndex,              // posizione rotonda (1..12)
    currentPlan,
    fetchAssignedGuests,
    fetchUnassignedGuestsCount,
}) {
    const [allGuests, setAllGuests] = useState([]);
    const [selectedGuests, setSelectedGuests] = useState([]);

    useEffect(() => {
        if (open) {
            fetchAllGuests();
        } else {
            // Pulizia alla chiusura
            setAllGuests([]);
            setSelectedGuests([]);
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

    // Gestione della selezione multipla
    const handleSelect = (id_guest) => {
        setSelectedGuests((prev) =>
            prev.includes(id_guest)
                ? prev.filter((id) => id !== id_guest)
                : [...prev, id_guest]
        );
    };

    const handleConfirm = async () => {
        if (selectedGuests.length === 0) return;

        const validGuests = selectedGuests.filter((_, index) => seatIndex + index <= 12);

        try {
            // Per ogni invitato selezionato, rimuove l'eventuale vecchia assegnazione e ne crea una nuova
            await Promise.all(
                validGuests.map(async (id_guest, index) => {
                    const currentSeat = seatIndex + index;
                    try {
                        await api.delete(`/table-layouts/round/${id_guest}`, {
                            params: { plan: currentPlan },
                        });
                    } catch (error) {
                        // Se l'invitato non era già assegnato, ignoriamo l'errore
                    }
                    await api.post('/table-layouts', {
                        id_guest,
                        id_table: table.id_table,
                        table_order: 0, // ad es. 0 per i tavoli rotondi
                        table_side_position: currentSeat,
                        plan: currentPlan,
                    });
                })
            );

            // Aggiorna i dati
            await fetchAllGuests();
            await fetchAssignedGuests();
            await fetchUnassignedGuestsCount();

            // Chiude il dialog
            handleClose();
        } catch (error) {
            console.error('Errore handleConfirm AddMultipleGuestRoundDialog:', error);
        }
    };

    // Raggruppa invitati non assegnati e assegnati
    const unassigned = allGuests.filter((g) => !g.id_table);
    const assigned = allGuests.filter((g) => g.id_table);

    // Mappa i tavoli ai rispettivi invitati assegnati
    const assignedMap = {};
    assigned.forEach((g) => {
        const groupKey = `Tavolo ${g.table_name || g.id_table}`;
        if (!assignedMap[groupKey]) {
            assignedMap[groupKey] = [];
        }
        assignedMap[groupKey].push(g);
    });

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Aggiungi Invitati a {table?.table_name || '(rotondo)'}
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

                {/* Invitati non assegnati */}
                <ListSubheader disableSticky sx={{ color: 'black' }}>
                    Non Assegnati
                </ListSubheader>
                <List dense>
                    {unassigned.map((guest) => {
                        const isSelected = selectedGuests.includes(guest.id_guest);
                        return (
                            <ListItem
                                key={guest.id_guest}
                                button
                                onClick={() => handleSelect(guest.id_guest)}
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
                                        onChange={() => handleSelect(guest.id_guest)}
                                    />
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })}
                </List>

                {/* Invitati assegnati raggruppati per tavolo */}
                {Object.keys(assignedMap).map((groupKey) => (
                    <Accordion key={groupKey}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography>{groupKey}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {assignedMap[groupKey]
                                    .slice()
                                    .sort(
                                        (a, b) =>
                                            Number(a.table_side_position || 0) -
                                            Number(b.table_side_position || 0)
                                    )
                                    .map((guest) => {
                                        const isSelected = selectedGuests.includes(guest.id_guest);
                                        return (
                                            <ListItem
                                                key={guest.id_guest}
                                                button
                                                onClick={() => handleSelect(guest.id_guest)}
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
                                                        onChange={() => handleSelect(guest.id_guest)}
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

export default AddMultipleGuestRoundDialog;
