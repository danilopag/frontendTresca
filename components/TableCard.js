/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React from 'react';
import { Box, Typography, IconButton, Card, CardContent, Tooltip } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import RoundTable from './RoundTable';
import RectangularTable from './RectangularTable';

const TableCard = ({
    table,
    guests,
    getGuestsByTableAndOrder,
    handleDeleteClick,
    setEditTableId,
    editTableName,
    setEditTableName,
    setOpenEditTableDialog,
    currentPlan,
    fetchAssignedGuests,
    fetchUnassignedGuestsCount,
    // Aggiungiamo la mappa con gli indici globali
    globalIndexesMap,
}) => {
    const handleEdit = () => {
        setEditTableId(table.id_table);
        setEditTableName(editTableName || table.table_name);
        setOpenEditTableDialog(true);
    };

    const handleDelete = () => {
        handleDeleteClick(table.id_table);
    };

    return (
        <Card
            sx={{
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: '1px solid #788c3c',
                borderRadius: 2,
                padding: 2,
                height: '100%',
            }}
        >
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" noWrap>
                        {editTableName || table.table_name}
                    </Typography>
                    <Box>
                        <Tooltip title="Modifica Tavolo">
                            <IconButton
                                onClick={handleEdit}
                                size="small"
                                sx={{ mr: 1, color: '#788c3c' }}
                            >
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina Tavolo">
                            <IconButton
                                onClick={handleDelete}
                                size="small"
                                sx={{ color: '#788c3c' }}
                            >
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Mostra la forma appropriata */}
                {table.table_type === 'round' && (
                    <RoundTable
                        table={table}
                        guests={guests}
                        getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                        currentPlan={currentPlan}
                        fetchAssignedGuests={fetchAssignedGuests}
                        fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                        globalIndexesMap={globalIndexesMap}
                    />
                )}

                {(table.table_type === 'rectangular' || table.table_type === 's_shaped') && (
                    <RectangularTable
                        table={table}
                        guests={guests}
                        getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                        currentPlan={currentPlan}
                        fetchAssignedGuests={fetchAssignedGuests}
                        fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                        globalIndexesMap={globalIndexesMap}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default TableCard;
