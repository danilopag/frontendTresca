// components/Chat.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    IconButton,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    List,
    ListItem,
    ListItemText,
    Typography,
    Avatar,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/system';
import { Chat as ChatIcon, Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../utils/api';

const ChatContainer = styled('div')(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 1000,
}));

const Chat = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [user, setUser] = useState(null); // Inizializza user come null

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const messagesEndRef = useRef(null);

    // Accedi a localStorage all'interno di useEffect
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            setUser(storedUser);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 100000); // Aggiorna ogni 10 secondi
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchMessages = async () => {
        if (!user) return;
        try {
            const res = await api.get('/messages', { params: { id_user: user.id } });
            setMessages(res.data);
            if (!open) {
                res.data.forEach((msg) => {
                    if (!msg.read_message && msg.id_admin !== null) {
                        setUnreadCount((prev) => prev + 1);
                        console.log('Messaggio non letto:', msg)
                    }
                });

                if (
                    unreadCount > 0 &&
                    typeof window !== 'undefined' &&
                    'Notification' in window &&
                    Notification.permission === 'granted'
                ) {
                    new Notification('Nuovo messaggio dall\'assistenza');
                }
            }
        } catch (error) {
            console.error('Errore nel recupero dei messaggi:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !user) return;
        try {
            await api.post('/messages', {
                text_message: newMessage,
                id_user: user.id,
                id_admin: null, // Messaggio inviato dall'utente
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.error('Errore nell\'invio del messaggio:', error);
        }
    };

    const markMessagesAsRead = async () => {
        if (!user) return;
        try {
            await api.put('/messages/read', {
                id_user: user.id,
            });  
        } catch (error) {
            console.error('Errore nel marcare i messaggi come letti:', error);
        }
    };

    const handleOpenChat = () => {
        setOpen(true);
        setUnreadCount(0);
        markMessagesAsRead();
    };

    const handleCloseChat = () => {
        setOpen(false);
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted') {
                Notification.requestPermission();
            }
        }
    }, []);

    return (
        <ChatContainer>
            <IconButton 
                color="primary" 
                onClick={handleOpenChat}
                sx={{
                    backgroundColor: '#f5f5dc', 
                    borderRadius: '50%',
                    '&:hover': {
                        backgroundColor: '#e0e0d1',
                    },
                }}
            >
                <Badge badgeContent={unreadCount} color="secondary">
                    <ChatIcon />
                </Badge>
            </IconButton>
            <Dialog
                open={open}
                onClose={handleCloseChat}
                fullScreen={fullScreen}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    style: { display: 'flex', flexDirection: 'column', height: '70vh' },
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={handleCloseChat}
                            aria-label="close"
                            sx={{ mr: 1 }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h6">
                            Chat di Assistenza
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent style={{ flexGrow: 1, overflowY: 'auto' }}>
                    <List>
                        {messages.map((msg) => (
                            <ListItem
                                key={msg.id_message}
                                alignItems="flex-start"
                                style={{
                                    flexDirection: msg.id_admin ? 'row' : 'row-reverse',
                                }}
                            >
                                <Avatar
                                    sx={{ bgcolor: msg.id_admin ? 'grey.500' : 'primary.main', margin: '0 8px' }}
                                >
                                    {msg.id_admin ? 'A' : 'U'}
                                </Avatar>
                                <Box
                                    bgcolor={msg.id_admin ? 'grey.300' : 'primary.main'}
                                    color={msg.id_admin ? 'black' : 'white'}
                                    borderRadius={2}
                                    p={1}
                                    maxWidth="80%"
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2">
                                                {msg.text_message}
                                            </Typography>
                                        }
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
                </DialogContent>
                <Box display="flex" alignItems="center" p={1}>
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
                    <IconButton color="primary" onClick={handleSendMessage}>
                        <SendIcon />
                    </IconButton>
                </Box>
            </Dialog>
        </ChatContainer>
    );
};

export default Chat;
