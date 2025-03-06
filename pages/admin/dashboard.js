/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import {
    Typography,
    Box,
    Button,
    IconButton,
    Tooltip,
    useMediaQuery,
    Card,
    CardContent,
    CardActions,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    MenuItem,
    CircularProgress
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    Chat as ChatIcon,
    GetApp as GetAppIcon,
    Visibility as VisibilityIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminChat from '../../components/AdminChat';
import AlertModal from '../../components/AlertModal';
import RegisterUserDialog from '../../components/RegisterUserDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import withAuth from '../../components/withAuth';
import Slider from 'react-slick';
import ExcelJS from 'exceljs';

const DashboardContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(4),
    maxWidth: '1200px',
    margin: 'auto',
}));

function mapIntolerance(value) {
    const intoleranceMap = {
        'baby': 'Bambino',
        'vegetarian': 'Vegetariano',
        'vegan': 'Vegano',
        'gluten_free': 'Senza Glutine',
        'pregnant': 'Incinta',
        'lactose_free': 'Senza Lattosio',
        'other': 'Altro',
    };
    return intoleranceMap[value] || "Valore non valido";
}

function parseDate(dateStr) {
    // ritorna un numero (timestamp) o Infinity se non c'è
    if (!dateStr) return Infinity;
    return new Date(dateStr).getTime();
}

function isEventPast(dateStr) {
    if (!dateStr) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    const eventDay = new Date(dateStr).setHours(0, 0, 0, 0);
    return eventDay < today;
}

// Ordina: prima tutti upcoming (asc), poi passati (asc)
function sortUsersByEventDate(users) {
    // Copia
    const arr = [...users];
    arr.sort((a, b) => {
        const aPast = isEventPast(a.event_date);
        const bPast = isEventPast(b.event_date);

        // se A non past e B past => A prima
        if (!aPast && bPast) return -1;
        // se A past e B non past => B prima
        if (aPast && !bPast) return 1;

        // altrimenti entrambi o past o entrambi future => ordina per data asc
        const aTime = parseDate(a.event_date);
        const bTime = parseDate(b.event_date);
        return aTime - bTime;
    });
    return arr;
}

const AdminDashboard = () => {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [users, setUsers] = useState([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Stato alert
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const [planUserId, setPlanUserId] = useState(null);
    const [planNomeUtente, setPlanNomeUtente] = useState('');
    const [planEventDate, setPlanEventDate] = useState('');

    // [PASSWORD ADMIN] Dialog
    const [adminChangePwdDialogOpen, setAdminChangePwdDialogOpen] = useState(false);
    const [adminCurrentPwd, setAdminCurrentPwd] = useState('');
    const [adminNewPwd1, setAdminNewPwd1] = useState('');
    const [adminNewPwd2, setAdminNewPwd2] = useState('');

    // Dialog per modifica password UTENTE
    const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    // Dialog per modifica UTENTE
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editUserData, setEditUserData] = useState({
        nomeutente: '',
        email: '',
        password: '',
        event_name: '',
        event_date: '',
    });

    // Dialog di caricamento Excel
    const [excelLoading, setExcelLoading] = useState(false);

    useEffect(() => {
        // verifica admin
        if (typeof window !== 'undefined') {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.is_admin) {
                router.push('/');
            } else {
                fetchUsers();
            }
        }
    }, [router]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            const nonAdminUsers = res.data.filter((u) => !u.is_admin);
            setUsers(nonAdminUsers);
        } catch (error) {
            console.error('Errore nel recupero degli utenti:', error);
        }
    };

    // Chat
    const handleOpenChat = (userId) => {
        setSelectedUserId(userId);
        setChatOpen(true);
    };
    const handleCloseChat = () => {
        setChatOpen(false);
        setSelectedUserId(null);
    };

    // Elimina utente
    const handleDeleteUserClick = (userId) => {
        setSelectedUserId(userId);
        setConfirmOpen(true);
    };
    const handleConfirmDeleteUser = async () => {
        try {
            await api.delete(`/users/${selectedUserId}`);
            fetchUsers();
            setConfirmOpen(false);
            setSelectedUserId(null);
        } catch (error) {
            console.error("Errore nell'eliminazione dell'utente:", error);
        }
    };

    const showAlert = (title, message) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertOpen(true);
    };

    // Dialog Modifica UTENTE
    const handleOpenEditDialog = (user) => {
        setSelectedUserId(user.id_user);
        setEditUserData({
            nomeutente: user.nomeutente || '',
            email: user.email || '',
            password: '',
            event_name: user.event_name || '',
            event_date: user.event_date ? user.event_date.split('T')[0] : '',
        });
        setEditDialogOpen(true);
    };
    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
    };
    const handleConfirmEditUser = async () => {
        try {
            if (!selectedUserId) return;
            await api.put(`/users/${selectedUserId}`, {
                nomeutente: editUserData.nomeutente,
                email: editUserData.email,
                password: editUserData.password,
                event_name: editUserData.event_name,
                event_date: editUserData.event_date,
            });
            setEditDialogOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Errore durante la modifica:', error);
        }
    };

    // Nuova funzione per bloccare le modifiche all'utente
    const handleLockEdit = async (userId) => {
        try {
            await api.put(`/users/${userId}`, { lockEdit: true });
            fetchUsers();
        } catch (error) {
            console.error("Errore nel bloccare le modifiche dell'utente:", error);
        }
    };

    // Download Excel Invitati
    const downloadGuestList = async (userId, nomeutente, event_date) => {
        try {
            const res = await api.get(`/admin/guests`, { params: { userId } });
            const guestsData = res.data;

            const categoriesRes = await api.get(`/admin/categories`, { params: { userId } });
            const categoriesMap = {};
            categoriesRes.data.forEach(cat => {
                categoriesMap[cat.id_category] = cat.name_categories;
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Invitati');
            worksheet.columns = [
                { header: 'Nome e Cognome', key: 'nome_cognome', width: 30 },
                { header: 'Categoria', key: 'categoria', width: 20 },
                { header: 'Bambino', key: 'bambino', width: 10 },
                { header: 'Vegetariano', key: 'vegetariano', width: 15 },
                { header: 'Vegano', key: 'vegano', width: 10 },
                { header: 'Gluten Free', key: 'gluten_free', width: 15 },
                { header: 'Incinta', key: 'incinta', width: 10 },
                { header: 'Lactose Free', key: 'lactose_free', width: 15 },
                { header: 'Altro', key: 'altro', width: 10 },
                { header: 'Testo altro', key: 'testo_altro', width: 30 },
            ];

            guestsData.forEach(guest => {
                const intolerances = guest.intolerances || [];
                worksheet.addRow({
                    nome_cognome: `${guest.guest_name}`,
                    categoria: categoriesMap[guest.id_category] || '',
                    bambino: intolerances.includes('baby') ? 'SI' : '',
                    vegetariano: intolerances.includes('vegetarian') ? 'SI' : '',
                    vegano: intolerances.includes('vegan') ? 'SI' : '',
                    gluten_free: intolerances.includes('gluten_free') ? 'SI' : '',
                    incinta: intolerances.includes('pregnant') ? 'SI' : '',
                    lactose_free: intolerances.includes('lactose_free') ? 'SI' : '',
                    altro: intolerances.includes('other') ? 'SI' : '',
                    testo_altro: guest.other_text || '',
                });
            });

            worksheet.eachRow({ includeEmpty: false }, function (row) {
                row.eachCell({ includeEmpty: false }, function (cell) {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const formattedEventDate = new Date(event_date).toLocaleDateString('it-IT');
            link.href = url;
            link.setAttribute(
                'download',
                `lista_invitati_${nomeutente}_${formattedEventDate}.xlsx`
            );
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        }
    };

    // Dialog Registra Nuovo Utente
    const handleOpenRegisterDialog = () => {
        setRegisterDialogOpen(true);
    };
    const handleCloseRegisterDialog = () => {
        setRegisterDialogOpen(false);
    };
    const handleUserRegistered = () => {
        fetchUsers();
    };

    // Dialog Modifica Password UTENTE
    const handleOpenChangePasswordDialog = (userId) => {
        setSelectedUserId(userId);
        setChangePasswordDialogOpen(true);
    };
    const handleCloseChangePasswordDialog = () => {
        setNewPassword('');
        setChangePasswordDialogOpen(false);
        setSelectedUserId(null);
    };
    const handleConfirmChangePassword = async () => {
        try {
            if (!selectedUserId) return;
            await api.put(`/users/${selectedUserId}`, { password: newPassword });
            handleCloseChangePasswordDialog();
        } catch (error) {
            console.error('Errore durante la modifica della password:', error);
        }
    };

    // [PASSWORD ADMIN]
    const handleOpenAdminChangePwdDialog = () => {
        setAdminChangePwdDialogOpen(true);
    };
    const handleCloseAdminChangePwdDialog = () => {
        setAdminCurrentPwd('');
        setAdminNewPwd1('');
        setAdminNewPwd2('');
        setAdminChangePwdDialogOpen(false);
    };
    const handleConfirmAdminChangePwd = async () => {
        if (!adminCurrentPwd || !adminNewPwd1 || !adminNewPwd2) {
            showAlert('Errore', 'Compila tutti i campi password');
            return;
        }
        if (adminNewPwd1 !== adminNewPwd2) {
            showAlert('Errore', 'Le due nuove password non corrispondono');
            return;
        }
        try {
            const res = await api.post('/admin/changePassword', {
                currentPassword: adminCurrentPwd,
                newPassword: adminNewPwd1
            });
            if (res.data.success) {
                showAlert('Successo', 'Password aggiornata correttamente');
                handleCloseAdminChangePwdDialog();
            } else {
                showAlert('Errore', 'Impossibile aggiornare la password');
            }
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Si è verificato un errore nel cambio password');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/');
    };

    // Apertura "Map Preview"
    const handleOpenMapPreview = (userId) => {
        router.push(`/admin/mapPreview?id_user=${userId}`);
    };

    // Slider
    const sliderSettings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: isMobile ? 1 : 2,
        slidesToScroll: 1,
    };

    // Applichiamo l'ordinamento prima di fare .map
    const sortedUsers = sortUsersByEventDate(users);

    return (
        <>
            <DashboardContainer>
                <Box display="flex" flexDirection="column" mb={2}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        flexDirection={isMobile ? 'column' : 'row'}
                        mb={2}
                    >
                        <Typography
                            variant="h4"
                            gutterBottom
                        >
                            Dashboard Amministratore
                        </Typography>

                        <Box display="flex" alignItems="center" gap={2} mt={isMobile ? 2 : 0}>
                            <Button
                                variant="contained"
                                onClick={handleOpenAdminChangePwdDialog}
                                sx={{
                                    backgroundColor: '#788c3c',
                                    color: 'white',
                                    ':hover': { backgroundColor: '#657a33' },
                                }}
                            >
                                Modifica Password
                            </Button>

                            {!isMobile && (
                                <Button
                                    variant="contained"
                                    onClick={handleOpenRegisterDialog}
                                    sx={{
                                        backgroundColor: '#788c3c',
                                        color: 'white',
                                        ':hover': { backgroundColor: '#657a33' },
                                    }}
                                >
                                    Registra Nuovo Utente
                                </Button>
                            )}

                            <Button
                                variant="contained"
                                onClick={handleLogout}
                                sx={{
                                    backgroundColor: 'red',
                                    color: 'white',
                                    ':hover': { backgroundColor: '#b71c1c' },
                                }}
                            >
                                Logout
                            </Button>
                        </Box>
                    </Box>

                    {isDesktop ? (
                        <Grid container spacing={2}>
                            {sortedUsers.map((user) => {
                                const bgColor = isEventPast(user.event_date)
                                    ? '#f8d7da'
                                    : 'transparent';

                                return (
                                    <Grid item xs={12} sm={6} md={4} key={user.id_user}>
                                        <Card
                                            sx={{
                                                backgroundColor: bgColor,
                                                boxShadow: 'none',
                                                border: '1px solid #788c3c',
                                                borderRadius: 2,
                                                padding: 2,
                                                height: '100%',
                                            }}
                                        >
                                            <CardContent sx={{ minHeight: '180px' }}>
                                                <Typography
                                                    variant="h6"
                                                    gutterBottom
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                    }}
                                                >
                                                    {user.nomeutente} - {user.event_name}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    gutterBottom
                                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                >
                                                    Email: {user.email}
                                                </Typography>
                                                <Typography variant="body2" gutterBottom>
                                                    Data Evento:{' '}
                                                    {new Date(user.event_date).toLocaleDateString()}
                                                </Typography>
                                            </CardContent>
                                            <CardActions
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    width: '100%',
                                                }}
                                            >
                                                <Tooltip title="Chatta con l'utente">
                                                    <IconButton
                                                        onClick={() => handleOpenChat(user.id_user)}
                                                        sx={{ color: '#788c3c' }}
                                                    >
                                                        <ChatIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Scarica Excel Invitati">
                                                    <IconButton
                                                        onClick={() =>
                                                            downloadGuestList(
                                                                user.id_user,
                                                                user.nomeutente,
                                                                user.event_date
                                                            )
                                                        }
                                                        sx={{ color: '#788c3c' }}
                                                    >
                                                        <GetAppIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Vedi Mappa (PDF)">
                                                    <IconButton
                                                        onClick={() => handleOpenMapPreview(user.id_user)}
                                                        sx={{ color: '#788c3c' }}
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Modifica Utente">
                                                    <IconButton
                                                        onClick={() => handleOpenEditDialog(user)}
                                                        sx={{ color: '#788c3c' }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Elimina Utente">
                                                    <IconButton
                                                        onClick={() => handleDeleteUserClick(user.id_user)}
                                                        sx={{ color: '#788c3c' }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={user.lockEdit ? "Modifiche Utente Bloccate!" : "Blocca Modifiche Utente"}>
                                                    <IconButton
                                                        onClick={() => handleLockEdit(user.id_user)}
                                                        sx={{ color: user.lockEdit ? '#D70040' : '#788c3c' }}
                                                    >
                                                        <LockOutlinedIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    ) : (
                        <>
                            <Slider {...sliderSettings}>
                                {sortedUsers.map((user) => {
                                    const bgColor = isEventPast(user.event_date)
                                        ? '#f8d7da'
                                        : 'transparent';

                                    return (
                                        <Box key={user.id_user} px={1}>
                                            <Card
                                                sx={{
                                                    backgroundColor: bgColor,
                                                    boxShadow: 'none',
                                                    border: '1px solid #788c3c',
                                                    borderRadius: 2,
                                                    padding: 2,
                                                    height: '100%',
                                                }}
                                            >
                                                <CardContent sx={{ minHeight: '180px' }}>
                                                    <Typography
                                                        variant="h6"
                                                        gutterBottom
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                        }}
                                                    >
                                                        {user.nomeutente} - {user.event_name}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        gutterBottom
                                                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                    >
                                                        Email: {user.email}
                                                    </Typography>
                                                    <Typography variant="body2" gutterBottom>
                                                        Data Evento:{' '}
                                                        {new Date(user.event_date).toLocaleDateString()}
                                                    </Typography>
                                                </CardContent>
                                                <CardActions
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Tooltip title="Chatta con l'utente">
                                                        <IconButton
                                                            onClick={() => handleOpenChat(user.id_user)}
                                                            sx={{ color: '#788c3c' }}
                                                        >
                                                            <ChatIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Scarica Excel Invitati">
                                                        <IconButton
                                                            onClick={() =>
                                                                downloadGuestList(
                                                                    user.id_user,
                                                                    user.nomeutente,
                                                                    user.event_date
                                                                )
                                                            }
                                                            sx={{ color: '#788c3c' }}
                                                        >
                                                            <GetAppIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Vedi Mappa (PDF)">
                                                        <IconButton
                                                            onClick={() => handleOpenMapPreview(user.id_user)}
                                                            sx={{ color: '#788c3c' }}
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Modifica Utente">
                                                        <IconButton
                                                            onClick={() => handleOpenEditDialog(user)}
                                                            sx={{ color: '#788c3c' }}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Elimina Utente">
                                                        <IconButton
                                                            onClick={() => handleDeleteUserClick(user.id_user)}
                                                            sx={{ color: '#788c3c' }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Blocca Modifiche Utente">
                                                        <IconButton
                                                            onClick={() => handleBloccaModifiche(user.id_user)}
                                                            sx={{ color: '#788c3c' }}
                                                        >
                                                            <LockOutlinedIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </CardActions>
                                            </Card>
                                        </Box>
                                    );
                                })}
                            </Slider>

                            {isMobile && (
                                <Box mt={4} width="100%">
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleOpenRegisterDialog}
                                        sx={{
                                            backgroundColor: '#788c3c',
                                            color: 'white',
                                            ':hover': { backgroundColor: '#657a33' },
                                        }}
                                    >
                                        Registra Nuovo Utente
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </DashboardContainer>

            {/* Dialog di Chat */}
            {selectedUserId && (
                <AdminChat
                    open={chatOpen}
                    onClose={handleCloseChat}
                    userId={selectedUserId}
                    userName={users.find((u) => u.id_user === selectedUserId).nomeutente}
                />
            )}

            {/* Dialog per registrare nuovo utente */}
            <RegisterUserDialog
                open={registerDialogOpen}
                onClose={handleCloseRegisterDialog}
                onUserRegistered={handleUserRegistered}
            />

            {/* Dialog di conferma eliminazione utente */}
            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDeleteUser}
                title="Conferma Eliminazione Utente"
                content="Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata."
            />

            {/* Dialog per modifica password UTENTE */}
            <Dialog open={changePasswordDialogOpen} onClose={handleCloseChangePasswordDialog}>
                <DialogTitle>Modifica Password Utente</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nuova Password"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseChangePasswordDialog}>Annulla</Button>
                    <Button onClick={handleConfirmChangePassword} variant="contained">
                        Salva
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog per la modifica UTENTE */}
            <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth>
                <DialogTitle>Modifica Utente</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        label="Nome Utente"
                        fullWidth
                        margin="dense"
                        value={editUserData.nomeutente}
                        onChange={(e) => setEditUserData({ ...editUserData, nomeutente: e.target.value })}
                    />
                    <TextField
                        label="Email"
                        fullWidth
                        margin="dense"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    />
                    <TextField
                        label="Nuova Password (lascia vuoto se non vuoi cambiarla)"
                        type="password"
                        fullWidth
                        margin="dense"
                        value={editUserData.password}
                        onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                    />
                    <TextField
                        label="Nome Evento"
                        fullWidth
                        margin="dense"
                        value={editUserData.event_name}
                        onChange={(e) => setEditUserData({ ...editUserData, event_name: e.target.value })}
                    />
                    <TextField
                        label="Data Evento"
                        type="date"
                        fullWidth
                        margin="dense"
                        value={editUserData.event_date}
                        onChange={(e) => setEditUserData({ ...editUserData, event_date: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>Annulla</Button>
                    <Button variant="contained" onClick={handleConfirmEditUser}>
                        Salva
                    </Button>
                </DialogActions>
            </Dialog>

            {/* [PASSWORD ADMIN] Dialog Modifica Password Admin */}
            <Dialog open={adminChangePwdDialogOpen} onClose={handleCloseAdminChangePwdDialog}>
                <DialogTitle>Modifica Password (Admin)</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Password Attuale"
                        type="password"
                        fullWidth
                        margin="dense"
                        value={adminCurrentPwd}
                        onChange={(e) => setAdminCurrentPwd(e.target.value)}
                    />
                    <TextField
                        label="Nuova Password"
                        type="password"
                        fullWidth
                        margin="dense"
                        value={adminNewPwd1}
                        onChange={(e) => setAdminNewPwd1(e.target.value)}
                    />
                    <TextField
                        label="Conferma Nuova Password"
                        type="password"
                        fullWidth
                        margin="dense"
                        value={adminNewPwd2}
                        onChange={(e) => setAdminNewPwd2(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAdminChangePwdDialog}>Annulla</Button>
                    <Button variant="contained" onClick={handleConfirmAdminChangePwd}>
                        Salva
                    </Button>
                </DialogActions>
            </Dialog>

            {/* AlertModal */}
            <AlertModal
                open={alertOpen}
                onClose={() => setAlertOpen(false)}
                title={alertTitle}
                message={alertMessage}
            />

            {/* Dialog Caricamento Excel */}
            <Dialog open={excelLoading} PaperProps={{ sx: { textAlign: 'center', p: 4 } }}>
                <DialogTitle>Generazione Excel in corso...</DialogTitle>
                <DialogContent>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Attendere prego...
                    </Typography>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default withAuth(AdminDashboard);
