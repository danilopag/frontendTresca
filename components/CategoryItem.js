// components/CategoryItem.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Edit, ExpandMore, ExpandLess } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrop } from 'react-dnd';
import api from '../utils/api'; // Importa api

const CategoryItem = ({
    category,
    getGuestsByCategory,
    expandedCategories,
    handleCategoryExpand,
    setEditingCategoryId,
    setNewCategoryName,
    setOpenCategoryDialog,
    GuestItem,
    fetchGuests,
    showAlert,
}) => {
    const [, drop] = useDrop({
        accept: 'guest',
        drop: async (item) => {
            try {
                await api.put(`/guests/${item.guest.id_guest}`, {
                    guest_name: item.guest.guest_name,
                    guest_surname: item.guest.guest_surname,
                    id_category: category.id_category,
                    intolerances: item.guest.intolerances || [],
                });
                fetchGuests();
            } catch (error) {
                console.error(error);
                showAlert('Errore', 'Errore durante lo spostamento dell\'invitato');
            }
        },
    });

    return (
        <motion.div
            ref={drop}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                    <Typography variant="h6">{category.name_categories}</Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                        ({getGuestsByCategory(category.id_category).length} invitati)
                    </Typography>
                </Box>
                <Box>
                    <IconButton
                        onClick={() => {
                            setEditingCategoryId(category.id_category);
                            setNewCategoryName(category.name_categories);
                            setOpenCategoryDialog(true);
                        }}
                    >
                        <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleCategoryExpand(category.id_category)}>
                        {expandedCategories[category.id_category] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </Box>
            </Box>
            <AnimatePresence>
                {expandedCategories[category.id_category] && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <Box mt={2}>
                            {getGuestsByCategory(category.id_category).map((guest) => (
                                <GuestItem key={guest.id_guest} guest={guest} />
                            ))}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CategoryItem;
