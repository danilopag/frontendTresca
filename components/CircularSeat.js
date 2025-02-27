/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Box, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { Close as CloseIcon } from '@mui/icons-material';
import api from '../utils/api';
import AddSingleGuestRoundDialog from './AddSingleGuestRoundDialog';

// Esempio di piccolo pulsante circolare “X” (remove)
const RemoveButton = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: 'red',
    color: '#fff',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
}));

const CircularSeat = ({
    seatIndex,
    table,
    guestsInArea,
    currentPlan,
    fetchAssignedGuests,
    fetchUnassignedGuestsCount,
    globalIndexesMap, //Numerazione Globale degli invitati
}) => {
    // cerchiamo se a questa posizione c’è già un ospite
    const seatGuest = guestsInArea.find((g) => g.table_side_position === seatIndex + 1);

    // per calcolare la posizione radiale (supponendo 12 posizioni totali)
    const angleStep = (2 * Math.PI) / 12;
    const angle = seatIndex * angleStep - Math.PI/2; // Partiamo da 0 in alto
    const radius = 40; // percent: quanto "lontano" dal centro
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);

    // Apertura/chiusura dialog AddSingleGuest
    const [openDialog, setOpenDialog] = useState(false);

    // DRAG – se seatGuest esiste, allora possiamo trascinarlo
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: 'guest',
        canDrag: !!seatGuest,
        item: { guest: seatGuest },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [seatGuest]);

    // DROP
    const [{ isOver }, dropRef] = useDrop({
        accept: 'guest',
        drop: async (item) => {
            try {
                // rimuovi la vecchia assegnazione (se c’è)
                await api.delete(`/table-layouts/round/drop/${item.guest.id_guest}`, {
                    params: {
                        plan: currentPlan,
                        id_table: item.guest.id_table,
                        new_id_table: table.id_table,
                        table_order: item.guest.table_order,
                        table_side_position: item.guest.table_side_position,
                        new_table_side_position: seatIndex + 1,
                    },
                });
                // assegna qui
                await api.post('/table-layouts', {
                    id_guest: item.guest.id_guest,
                    id_table: table.id_table,
                    table_order: 0, // rotondo
                    table_side_position: seatIndex + 1,
                    plan: currentPlan,
                });
                await fetchAssignedGuests();
                await fetchUnassignedGuestsCount();
            } catch (error) {
                console.error('Errore in drop su seat rotondo:', error);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    });

    // uniamo drag e drop su un unico box
    const seatRef = (node) => {
        dropRef(node);
        dragRef(node);
    };

    // click sul seat
    const handleSeatClick = () => {
        // se seatGuest c’è, potremmo fare un menu con “rimuovi” o nulla
        // se seatGuest NON c’è, apriamo il dialog per aggiungere
        if (!seatGuest) {
            setOpenDialog(true);
        }
    };

    // rimuovi invitato
    const handleRemoveGuest = async (e) => {
        e.stopPropagation();
        if (!seatGuest) return;
        try {
            await api.delete(`/table-layouts/round/${seatGuest.id_guest}`, {
                params: { plan: currentPlan },
            });
            await fetchAssignedGuests();
            await fetchUnassignedGuestsCount();
        } catch (error) {
            console.error('Errore rimuovendo invitato dal seat rotondo:', error);
        }
    };

    // Calcoliamo l’indice globale (se esiste)
    const globalIndex = seatGuest
        ? globalIndexesMap?.[seatGuest.id_guest]
        : null;

    // Funzione per troncare il nome troppo lungo
    const truncate = (str, n = 7) => {
        if (!str) return "";
        return str.length > n ? str.substring(0, n) + ".." : str;
    };

    function mapIntolerance(value) {
        const intoleranceMap = {
            baby: 'Bambino',
            vegetarian: 'Vegetariano',
            vegan: 'Vegano',
            gluten_free: 'Senza Glutine',
            pregnant: 'Incinta',
            lactose_free: 'Senza Lattosio',
            other: 'Altro',
        };
        return intoleranceMap[value] || 'Valore non valido';
    }

    // testo tooltip
    let tooltipText = 'Clicca per aggiungere invitato';
    if (seatGuest) {
        tooltipText = '';
        if (globalIndex) {
            tooltipText += `#${globalIndex}-`;
        }
        tooltipText += seatGuest.guest_name;
        if (seatGuest.intolerances?.length) {
            tooltipText += `-[${seatGuest.intolerances.map(mapIntolerance).join(', ')}]`;
        }
    }

    return (
        <>
            <Tooltip title={tooltipText} arrow>
                <Box
                    ref={seatRef}
                    onClick={handleSeatClick}
                    sx={{
                        position: 'absolute',
                        top: `${y}%`,
                        left: `${x}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '25px',
                        border: isOver
                            ? '2px dashed #66f'
                            : seatGuest
                                ? '1px solid #aaa'
                                : '2px dashed #aaa',
                        backgroundColor: seatGuest ? '#f7f7f7' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: seatGuest ? 'default' : 'pointer',
                        opacity: isDragging ? 0.5 : 1,
                    }}
                >
                    {seatGuest ? (
                        <>
                            {/* Nome utente in piccolo + indice globale */}
                            <Typography
                                variant="caption"
                                sx={{ fontSize: '9px', fontWeight: 'bold', textAlign: 'center', textOverflow: 'ellipsis', px: 0.5 }}
                            >
                                {globalIndex ? ` ${globalIndex} - ` : ''}
                                {truncate(seatGuest.guest_name)}
                            </Typography>

                            {/* Tasto remove */}
                            <RemoveButton onClick={handleRemoveGuest}>
                                <CloseIcon sx={{ fontSize: '12px' }} />
                            </RemoveButton>
                        </>
                    ) : (
                        <Typography
                            variant="caption"
                            sx={{ color: '#999', fontSize: '10px' }}
                        >
                            Vuoto
                        </Typography>
                    )}
                </Box>
            </Tooltip>

            {/* Dialog per aggiungere un invitato se seat vuoto */}
            {openDialog && !seatGuest && (
                <AddSingleGuestRoundDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    table={table}
                    seatIndex={seatIndex + 1}
                    currentPlan={currentPlan}
                    fetchAssignedGuests={fetchAssignedGuests}
                    fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                />
            )}
        </>
    );
};

export default CircularSeat;
