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
 * AddSingleGuestRoundDialog:
 * - Permette di selezionare un solo invitato da aggiungere a un tavolo rotondo
 * - Usa `seatIndex` come posizione (table_side_position)
 * - table_order sarà 0 (o quello che usi per i tavoli rotondi)
 */
function AddSingleGuestRoundDialog({
    open,
    onClose,
    table,                  // es. { id_table, table_name, ... }
    seatIndex,             // posizione rotonda (1..12)
    currentPlan,
    fetchAssignedGuests,
    fetchUnassignedGuestsCount,
}) {
    const [allGuests, setAllGuests] = useState([]);
    const [selectedGuest, setSelectedGuest] = useState(null);

    useEffect(() => {
        if (open) {
            fetchAllGuests();
        } else {
            // pulizia quando chiudo
            setAllGuests([]);
            setSelectedGuest(null);
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

    // Selezione singola
    const handleSelect = (id_guest) => {
        setSelectedGuest((prev) => (prev === id_guest ? null : id_guest));
    };

    const handleConfirm = async () => {
        if (!selectedGuest) return;

        try {
            // 1) Rimuovi vecchia assegnazione (se esiste)
            try {
                await api.delete(`/table-layouts/guest/${selectedGuest}`, {
                    params: { plan: currentPlan },
                });
            } catch (error) {
                // se non era assegnato, ignoriamo
            }

            // 2) Assegna al tavolo rotondo
            //    table_order = 0 (o quello che usi per "round")
            //    table_side_position = seatIndex (attenzione: seatIndex + 1 se serve)
            await api.post('/table-layouts', {
                id_guest: selectedGuest,
                id_table: table.id_table,
                table_order: 0, // supponiamo 0 per i rotondi
                table_side_position: seatIndex,
                plan: currentPlan,
            });

            // 3) Aggiorna
            await fetchAllGuests();
            await fetchAssignedGuests();
            await fetchUnassignedGuestsCount();

            // 4) Chiudi
            handleClose();
        } catch (error) {
            console.error('Errore handleConfirm AddSingleGuestRoundDialog:', error);
        }
    };

    // Raggruppa “non assegnati” / “assegnati” (facoltativo)
    const unassigned = allGuests.filter((g) => !g.id_table);
    const assigned = allGuests.filter((g) => g.id_table);

    // Mappa tavoli -> invitati assegnati
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
                Aggiungi Invitato a {table?.table_name || '(rotondo)'}
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Typography variant="subtitle2" gutterBottom>
                    Seleziona l’invitato da aggiungere
                </Typography>

                {/* Non assegnati */}
                <ListSubheader>Non Assegnati</ListSubheader>
                <List dense>
                    {unassigned.map((guest) => {
                        const isSelected = selectedGuest === guest.id_guest;
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

                {/* Assegnati raggruppati per tavolo */}
                {Object.keys(assignedMap).map((groupKey) => (
                    <Accordion key={groupKey}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography>{groupKey}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {assignedMap[groupKey].map((guest) => {
                                    const isSelected = selectedGuest === guest.id_guest;
                                    return (
                                        <ListItem
                                            key={guest.id_guest}
                                            button
                                            onClick={() => handleSelect(guest.id_guest)}
                                            selected={isSelected}
                                        >
                                            <ListItemText
                                                primary={`${guest.guest_name}`}
                                                secondary={`Posizione: ${guest.table_side_position || '-'
                                                    }`}
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
                    disabled={!selectedGuest}
                >
                    Aggiungi
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddSingleGuestRoundDialog;
