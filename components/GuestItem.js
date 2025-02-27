// components/GuestItem.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDrag } from 'react-dnd';

const GuestItem = ({ guest, style, intoleranceIcons }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'guest',
        item: { guest },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <Box
            ref={drag}
            style={{
                ...style,
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: '#e0f7fa',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'move',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Typography variant="body2">
                {guest.guest_name.toUpperCase()}
            </Typography>
            <Box display="flex" alignItems="center" ml={1}>
                {guest.intolerances &&
                    guest.intolerances.length > 0 &&
                    guest.intolerances.map((intolerance) => (
                        <img
                            key={intolerance}
                            src={intoleranceIcons[intolerance]}
                            alt={intolerance}
                            style={{ width: 16, height: 16, marginLeft: 2 }}
                        />
                    ))}
            </Box>
        </Box>
    );
};

export default GuestItem;
