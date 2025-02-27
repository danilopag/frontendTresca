// components/AdminChat.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    TextField,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Typography,
    Box,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Send as SendIcon } from '@mui/icons-material';
import api from '../utils/api';
import { format } from 'date-fns';

const AdminChat = ({ open, onClose, userId, userName }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (userId && open) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 10000);
            return () => clearInterval(interval);
        }
    }, [userId, open]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/admin/messages/${userId}`);
            setMessages(res.data);
        } catch (error) {
            console.error('Errore nel recupero dei messaggi:', error);
        }
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;
        try {
            await api.post('/admin/messages', {
                text_message: newMessage,
                id_user: userId,
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.error("Errore nell'invio del messaggio:", error);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen}
        >
            <DialogTitle>
                Chat con {userName}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                <List sx={{ flexGrow: 1, overflowY: 'auto', padding: 2 }}>
                    {messages.map((msg) => (
                        <ListItem
                            key={msg.id_message}
                            alignItems="flex-start"
                            sx={{
                                flexDirection: msg.id_admin ? 'row-reverse' : 'row',
                                paddingY: 1,
                            }}
                        >
                            <Avatar
                                sx={{
                                    bgcolor: msg.id_admin ? 'primary.main' : 'grey.500',
                                    margin: '0 8px',
                                }}
                            >
                                {msg.id_admin ? 'A' : 'U'}
                            </Avatar>
                            <Box
                                sx={{
                                    bgcolor: msg.id_admin ? 'primary.main' : 'grey.300',
                                    color: msg.id_admin ? 'white' : 'black',
                                    borderRadius: 2,
                                    p: 1,
                                    maxWidth: '80%',
                                }}
                            >
                                <ListItemText
                                    primary={<Typography variant="body2">{msg.text_message}</Typography>}
                                    secondary={
                                        <Typography variant="caption">
                                            {format(new Date(msg.data), 'dd/MM/yyyy HH:mm')}
                                        </Typography>
                                    }
                                />
                            </Box>
                        </ListItem>
                    ))}
                    <div ref={messagesEndRef} />
                </List>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <TextField
                        variant="outlined"
                        size="small"
                        fullWidth
                        placeholder="Scrivi un messaggio..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSendMessage();
                            }
                        }}
                    />
                    <IconButton onClick={handleSendMessage} sx={{ color: '#788c3c' }}>
                        <SendIcon />
                    </IconButton>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default AdminChat;
