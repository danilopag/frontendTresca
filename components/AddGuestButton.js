// components/AddGuestButton.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useState } from 'react';
import { Button } from '@mui/material';
import AddGuestDialog from './AddGuestDialog';

const AddGuestButton = ({
    tableId,
    tableOrder,
    style,
    currentPlan,
    fetchAssignedGuests,
    fetchUnassignedGuestsCount,
}) => {
    const [openAddGuestDialog, setOpenAddGuestDialog] = useState(false);

    return (
        <div style={style}>
            <Button
                variant="outlined"
                onClick={() => setOpenAddGuestDialog(true)}
                sx={{ fontSize: '0.7rem' }}
            >
                Aggiungi Invitati
            </Button>
            {openAddGuestDialog && (
                <AddGuestDialog
                    tableId={tableId}
                    tableOrder={tableOrder}
                    onClose={() => setOpenAddGuestDialog(false)}
                    currentPlan={currentPlan}
                    fetchAssignedGuests={fetchAssignedGuests}
                    fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                />
            )}
        </div>
    );
};

export default AddGuestButton;
