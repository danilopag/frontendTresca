/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Box, Tooltip, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import api from '../utils/api';

const SeatBox = ({
    seat,
    side, // "top" | "left" | "bottom" | "right"
    onClickEmpty, // callback quando clicchiamo su seat vuoto
    table,
    currentPlan,
    fetchAssignedGuests,
    fetchUnassignedGuestsCount,
    isMobile,
    // AGGIUNTO: per la numerazione globale
    globalIndexesMap,
}) => {
    const seatWidth = isMobile ? 60 : 80;
    const seatHeight = isMobile ? 30 : 40;

    // DRAG: se seat è occupato, lo rendiamo sorgente di drag
    const [{ isDragging }, dragRef] = useDrag({
        type: 'guest',
        item: {
            guest: seat.guestData,
            fromTable: table.id_table,
            fromSide: side,
        },
        canDrag: () => !seat.isEmpty, // drag solo se NON è vuoto
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    // DROP: se seat è vuoto, può ricevere un guest
    const [{ isOver }, dropRef] = useDrop({
        accept: 'guest',
        drop: async (item) => {
            try {
                // Se seat è vuoto, aggiungiamo l’invitato qui
                if (seat.isEmpty) {
                    // 1) Rimuovi l’assegnazione precedente (se c’è)
                    try {
                        await api.delete(`/table-layouts/rect/drop/${item.guest.id_guest}`, {
                            params: {
                                plan: currentPlan,
                                id_table_destination: table.id_table,
                            },
                        });
                    } catch (error) {
                        // se l'ospite non era assegnato, ignoriamo
                    }

                    let sideOrder = 1;
                    if (side === 'top') sideOrder = 1;
                    else if (side === 'left') sideOrder = 2;
                    else if (side === 'bottom') sideOrder = 3;
                    else if (side === 'right') sideOrder = 4;

                    // 2) Ricava quanti ospiti sono già in questo “lato”
                    const assignedRes = await api.get('/guests/assigned', {
                        params: { plan: currentPlan, id_table: table.id_table },
                    });
                    const allAssigned = assignedRes.data || [];
                    const sameSide = allAssigned.filter((g) => g.table_order === sideOrder);
                    const nextPos = sameSide.length + 1;

                    // 3) Assegna il guest
                    await api.post('/table-layouts', {
                        id_guest: item.guest.id_guest,
                        id_table: table.id_table,
                        table_order: sideOrder,
                        table_side_position: nextPos,
                        plan: currentPlan,
                    });
                } else {
                    // Se seat NON è vuoto, qui gestisci lo scambio eventuale
                    // (attento alla logica di scambio se vuoi implementarla)
                    await api.put(`/table-layouts/rect/drop/change`, {
                        id_guest: item.guest.id_guest,
                        id_table: seat.guestData.id_table,
                        table_order: seat.guestData.table_order,
                        table_side_position: seat.guestData.table_side_position,
                        plan: currentPlan,
                    });
                    await api.put(`/table-layouts/rect/drop/change`, {
                        id_guest: seat.guestData.id_guest,
                        id_table: item.guest.id_table,
                        table_order: item.guest.table_order,
                        table_side_position: item.guest.table_side_position,
                        plan: currentPlan,
                    });
                }

                await fetchAssignedGuests();
                await fetchUnassignedGuestsCount();
            } catch (error) {
                console.error('Errore durante drop su seat vuoto:', error);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    });

    // Uniamo i ref di drag e drop
    const seatRef = (node) => {
        dragRef(node);
        dropRef(node);
    };

    // Stile del box seat
    const seatStyle = {
        width: `${seatWidth}px`,
        height: `${seatHeight}px`,
        border: '1px solid #999',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        backgroundColor: '#fafafa',
        cursor: seat.isEmpty ? 'pointer' : 'default',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isOver ? '0 0 0 2px #66f' : 'none',
        margin: '2px',
    };

    // Funzione per rimuovere manualmente l’utente
    const handleRemoveGuest = async (e) => {
        e.stopPropagation();
        if (!seat.guestData) return;
        try {
            await api.delete(`/table-layouts/rect/${seat.guestData.id_guest}`, {
                params: { plan: currentPlan },
            });
            await fetchAssignedGuests();
            await fetchUnassignedGuestsCount();
        } catch (error) {
            console.error('Errore eliminazione invitato dal tavolo:', error);
        }
    };

    // SEAT VUOTO
    if (seat.isEmpty) {
        return (
            <Box ref={seatRef} sx={seatStyle} onClick={onClickEmpty}>
                <Typography variant="caption" color="textSecondary">
                    Vuoto
                </Typography>
            </Box>
        );
    }

    // Calcoliamo l’indice globale, se presente
    const globalIndex = seat.guestData
        ? globalIndexesMap?.[seat.guestData.id_guest]
        : null;
    
    const truncate = (str, n = 9) => {
        if (!str) return "";
        return str.length > n ? str.substring(0, n) + "..." : str;
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
    let tooltipText = '';
    if (globalIndex) {
        tooltipText += `#${globalIndex}-`;
    }
    tooltipText += seat.guestData?.guest_name || 'Clicca per aggiungere invitato';
    if (seat.guestData?.intolerances?.length) {
        tooltipText += `-[${seat.guestData.intolerances.map(mapIntolerance).join(', ')}]`;
    }

    // SEAT OCCUPATO
    return (
        <Tooltip title={tooltipText} arrow>
            <Box ref={seatRef} sx={seatStyle}>
                {/* NOME INVITATO + eventuale indice globale */}
                <Typography
                    variant="caption"
                    sx={{ fontSize: '9px', fontWeight: 'bold', textAlign: 'center', textOverflow: 'ellipsis', px: 0.5 }}
                >
                    {globalIndex ? `${globalIndex} - ` : ''}
                    {truncate(seat.guestData?.guest_name)}
                </Typography>

                {/* Icona X rossa in alto a destra */}
                <Box
                    position="absolute"
                    top="2px"
                    right="2px"
                    width="16px"
                    height="16px"
                    borderRadius="50%"
                    bgcolor="red"
                    color="#fff"
                    fontSize="10px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{ cursor: 'pointer' }}
                    onClick={handleRemoveGuest}
                >
                    <span style={{ fontSize: '10px' }}>X</span>
                </Box>
            </Box>
        </Tooltip>
    );
};

export default SeatBox;
