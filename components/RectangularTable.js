/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import api from '../utils/api';
import AddSingleGuestRectDialog from './AddSingleGuestRectDialog';
import SeatBox from './SeatBox';
import { useTheme } from '@mui/material/styles';

function RectangularTable({
    table,
    guests,
    getGuestsByTableAndOrder,
    currentPlan,
    fetchAssignedGuests,
    fetchUnassignedGuestsCount,
    globalIndexesMap, // aggiunto
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [topSeats, setTopSeats] = useState([]);
    const [bottomSeats, setBottomSeats] = useState([]);
    const [leftSeats, setLeftSeats] = useState([]);
    const [rightSeats, setRightSeats] = useState([]);

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSeatSide, setSelectedSeatSide] = useState(null);

    useEffect(() => {
        const topGuests = getGuestsByTableAndOrder(table.id_table, 1) || [];
        const leftGuests = getGuestsByTableAndOrder(table.id_table, 2) || [];
        const bottomGuests = getGuestsByTableAndOrder(table.id_table, 3) || [];
        const rightGuests = getGuestsByTableAndOrder(table.id_table, 4) || [];

        setTopSeats(buildSeatsArray(topGuests, 'top'));
        setLeftSeats(buildSeatsArray(leftGuests, 'left'));
        setBottomSeats(buildSeatsArray(bottomGuests, 'bottom'));
        setRightSeats(buildSeatsArray(rightGuests, 'right'));
    }, [guests, table]);

    const buildSeatsArray = (guestList, side) => {
        const seats = guestList.map((g) => ({
            guestId: g.id_guest,
            guestData: g,
            isEmpty: false,
        }));
        // per forzare la presenza di uno slot vuoto (se vuoi) o no
        if ((side === 'top' || side === 'bottom') && seats.length >= 1) {
            return seats;
        }
        // Aggiunge uno slot vuoto se non c'è
        seats.push({ guestId: null, guestData: null, isEmpty: true });
        return seats;
    };

    const handleClickEmptySeat = (side) => {
        setSelectedSeatSide(side);
        setOpenDialog(true);
    };

    const handleSeatFilled = async (guestId) => {
        try {
            // Rimuovo la vecchia assegnazione se esiste
            try {
                await api.delete(`/table-layouts/${guestId}`, { params: { plan: currentPlan } });
            } catch (error) {
                // se non c'era, ignora
            }

            let sideOrder = 1;
            let seatsArray = [];

            if (selectedSeatSide === 'top') {
                sideOrder = 1;
                seatsArray = topSeats;
            } else if (selectedSeatSide === 'left') {
                sideOrder = 2;
                seatsArray = leftSeats;
            } else if (selectedSeatSide === 'bottom') {
                sideOrder = 3;
                seatsArray = bottomSeats;
            } else if (selectedSeatSide === 'right') {
                sideOrder = 4;
                seatsArray = rightSeats;
            }

            const existingFilled = seatsArray.filter((s) => !s.isEmpty).length;
            const table_side_position = existingFilled + 1;

            await api.post('/table-layouts', {
                id_guest: guestId,
                id_table: table.id_table,
                table_order: sideOrder,
                table_side_position,
                plan: currentPlan,
            });

            await fetchAssignedGuests();
            await fetchUnassignedGuestsCount();
        } catch (error) {
            console.error(error);
        }
        setOpenDialog(false);
    };

    // Calcoliamo la minHeight / height in base a quanti seat ho su left/right
    const maxLeftRightSeats = Math.max(leftSeats.length, rightSeats.length);
    const seatHeight = isMobile ? 35 : 40;
    const verticalPadding = 20;
    const totalHeight =
        maxLeftRightSeats * seatHeight + (maxLeftRightSeats - 1) * 8 + verticalPadding * 2;
    const finalHeight = Math.min(Math.max(totalHeight, 200), 600);

    // Il box che contiene la "S" o il rettangolo
    const baseCenterBoxStyles = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: isMobile ? '70px' : '100px',
        height: isMobile ? `${finalHeight * 0.7}px` : `${finalHeight * 0.8}px`,
        transform: 'translate(-50%, -50%)',
        transition: 'height 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    // Se table_type == "s_shaped", mostriamo l'img, sennò un box grigio
    const isSShaped = table.table_type === 's_shaped';

    return (
        <Box
            position="relative"
            width="100%"
            height={`${finalHeight}px`}
            sx={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'height 0.3s ease',
            }}
        >
            {/* Tavolo al centro */}
            {isSShaped ? (
                <Box sx={baseCenterBoxStyles}>
                    <Box
                        component="img"
                        src="/S.svg"
                        alt="Tavolo a S"
                        sx={{
                            width: isMobile ? '70px' : '100px',
                            height: isMobile ? `${finalHeight * 0.7}px` : `${finalHeight * 0.8}px`,
                            objectFit: 'fill',
                        }}
                    />
                </Box>
            ) : (
                <Box
                    sx={{
                        ...baseCenterBoxStyles,
                        bgcolor: '#ddd', // classico rettangolo
                    }}
                />
            )}

            {/* Lato TOP (table_order=1) */}
            <Box
                position="absolute"
                top="5%"
                left="50%"
                sx={{
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '8px',
                }}
            >
                {topSeats.map((seat, idx) => (
                    <SeatBox
                        key={`top-${idx}`}
                        seat={seat}
                        side="top"
                        table={table}
                        currentPlan={currentPlan}
                        fetchAssignedGuests={fetchAssignedGuests}
                        fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                        onClickEmpty={() => handleClickEmptySeat('top')}
                        isMobile={isMobile}
                        globalIndexesMap={globalIndexesMap} // pass
                    />
                ))}
            </Box>

            {/* Lato BOTTOM (table_order=3) */}
            <Box
                position="absolute"
                bottom="5%"
                left="50%"
                sx={{
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '8px',
                }}
            >
                {bottomSeats.map((seat, idx) => (
                    <SeatBox
                        key={`bottom-${idx}`}
                        seat={seat}
                        side="bottom"
                        table={table}
                        currentPlan={currentPlan}
                        fetchAssignedGuests={fetchAssignedGuests}
                        fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                        onClickEmpty={() => handleClickEmptySeat('bottom')}
                        isMobile={isMobile}
                        globalIndexesMap={globalIndexesMap} // pass
                    />
                ))}
            </Box>

            {/* Lato LEFT (table_order=2) */}
            <Box
                position="absolute"
                left="5%"
                top="50%"
                sx={{
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}
            >
                {leftSeats.map((seat, idx) => (
                    <SeatBox
                        key={`left-${idx}`}
                        seat={seat}
                        side="left"
                        table={table}
                        currentPlan={currentPlan}
                        fetchAssignedGuests={fetchAssignedGuests}
                        fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                        onClickEmpty={() => handleClickEmptySeat('left')}
                        isMobile={isMobile}
                        globalIndexesMap={globalIndexesMap} // pass
                    />
                ))}
            </Box>

            {/* Lato RIGHT (table_order=4) */}
            <Box
                position="absolute"
                right="5%"
                top="50%"
                sx={{
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}
            >
                {rightSeats.map((seat, idx) => (
                    <SeatBox
                        key={`right-${idx}`}
                        seat={seat}
                        side="right"
                        table={table}
                        currentPlan={currentPlan}
                        fetchAssignedGuests={fetchAssignedGuests}
                        fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                        onClickEmpty={() => handleClickEmptySeat('right')}
                        isMobile={isMobile}
                        globalIndexesMap={globalIndexesMap} // pass
                    />
                ))}
            </Box>

            {/* Dialog per aggiungere un singolo invitato */}
            {openDialog && selectedSeatSide && (
                <AddSingleGuestRectDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    onConfirm={handleSeatFilled}
                    table={table}
                    currentPlan={currentPlan}
                />
            )}
        </Box>
    );
}

export default RectangularTable;
