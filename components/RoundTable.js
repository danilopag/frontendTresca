/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React from 'react';
import { Box } from '@mui/material';
import CircularSeat from './CircularSeat';

const RoundTable = ({
    table,
    guests,
    getGuestsByTableAndOrder,
    currentPlan,
    fetchAssignedGuests,
    fetchUnassignedGuestsCount,
    globalIndexesMap, // aggiunto
}) => {
    // In questa implementazione, supponiamo 12 seat massimi
    const maxGuests = 12;
    const guestsInArea = getGuestsByTableAndOrder(table.id_table, 0);
    // Se usi 0 come table_order per i tavoli rotondi, adegua se necessario.

    // Creiamo un array di seatIndex [0..11]
    const seats = Array.from({ length: maxGuests }, (_, i) => i);

    return (
        <Box
            position="relative"
            width="100%"
            height="400px"
            sx={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: 'visible',
            }}
        >
            {/* Cerchio al centro per rappresentare il tavolo */}
            <Box
                position="absolute"
                top="50%"
                left="50%"
                width="40%"
                height="60%"
                bgcolor="#ccc"
                borderRadius="50%"
                sx={{ transform: 'translate(-50%, -50%)' }}
            />
            {/* Per ogni seat, renderizziamo un CircularSeat */}
            {seats.map((seatIndex) => (
                <CircularSeat
                    key={seatIndex}
                    seatIndex={seatIndex}
                    table={table}
                    guestsInArea={guestsInArea}
                    currentPlan={currentPlan}
                    fetchAssignedGuests={fetchAssignedGuests}
                    fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                    globalIndexesMap={globalIndexesMap}
                />
            ))}
        </Box>
    );
};

export default RoundTable;
