import React, { useState, useEffect, useRef } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
    Container,
    Box,
    Grid,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Drawer,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    useMediaQuery,
} from '@mui/material';

import {
    AddCircleOutline,
    Edit,
    Delete,
    GetApp as GetAppIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Close as CloseIcon,
    RotateRight,
} from '@mui/icons-material';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';

import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

import withAuth from '../components/withAuth';
import Chat from '../components/Chat';
import AlertModal from '../components/AlertModal';
import ConfirmDialog from '../components/ConfirmDialog';
import TableCard from '../components/TableCard';

import api from '../utils/api';

/* ----- SFONDO / OVERLAY ----- 
const Background = styled('div')({
    backgroundImage: 'url(/cover.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(8px)',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
});

const Overlay = styled('div')({
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
});
*/
/* ----- CONTENITORE PRINCIPALE ----- */
const ContentOverlay = styled('div')(({ theme }) => ({
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius,
    maxWidth: '1400px',
    margin: 'auto',
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
    boxShadow: theme.shadows[3],
    display: 'flex',
    flexDirection: 'column',
    minHeight: '80vh',
}));

function OnePageEvent() {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const dndBackend = isMobile ? TouchBackend : HTML5Backend;

    // *** DATI UTENTE ***
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [userName, setUserName] = useState('');

    // *** INVITATI & GRUPPI ***
    const [categories, setCategories] = useState([]);
    const [guests, setGuests] = useState([]);

    // Drawer invitato
    const [guestDrawerOpen, setGuestDrawerOpen] = useState(false);
    const [editingGuestId, setEditingGuestId] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [guestCategory, setGuestCategory] = useState('');
    const [guestIntolerances, setGuestIntolerances] = useState([]);
    const [guestOtherText, setGuestOtherText] = useState('');
    const [intoleranceSelectOpen, setIntoleranceSelectOpen] = useState(false);

    // Dialog categorie
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Mappatura intolleranze
    const intoleranceMap = {
        Bambino: 'baby',
        Vegetariano: 'vegetarian',
        Vegano: 'vegan',
        'Senza Glutine': 'gluten_free',
        Incinta: 'pregnant',
        'Senza Lattosio': 'lactose_free',
        Altro: 'other',
    };
    const intoleranceLabels = Object.keys(intoleranceMap);

    // *** MAPPA / TAVOLI ***
    const [currentPlan, setCurrentPlan] = useState('A');
    const [tables, setTables] = useState([]);
    const [assignedGuests, setAssignedGuests] = useState([]);
    const [unassignedGuestsCount, setUnassignedGuestsCount] = useState(0);
    const [mapTables, setMapTables] = useState([]);
    const mapRef = useRef(null);

    const [addTableDialogOpen, setAddTableDialogOpen] = useState(false);
    const [tableName, setTableName] = useState('');
    const [tableShape, setTableShape] = useState('rectangular');
    const [orderTable, setOrderTable] = useState(1);

    const [openEditTableDialog, setOpenEditTableDialog] = useState(false);
    const [editTableId, setEditTableId] = useState(null);
    const [editTableName, setEditTableName] = useState('');

    const [globalIndexesMap, setGlobalIndexesMap] = useState({});

    // Dialog TableCard
    const [tableCardOpen, setTableCardOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);

    // *** ALERT & CONFERMA ***
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(() => { });

    const showAlert = (title, msg) => {
        setAlertTitle(title);
        setAlertMessage(msg);
        setAlertOpen(true);
    };

    // *** USE EFFECT => LOAD DATA ***
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) return;
        const user = JSON.parse(stored);
        setUserName(user.name || '');
        setEventName(user.event_name || '');
        if (user.event_date) {
            const d = new Date(user.event_date);
            setEventDate(d.toLocaleDateString('it-IT'));
        }

        fetchCategories();
        fetchGuests();
        fetchTables();
        fetchMapTables();
        fetchAssignedGuests();
        fetchUnassignedGuestsCount();
    }, [currentPlan]);

    /* --------------------- INVITATI & GRUPPI --------------------- */
    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile caricare categorie/gruppi');
        }
    };

    const fetchGuests = async () => {
        try {
            const res = await api.get('/guests');
            setGuests(res.data);
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile caricare invitati');
        }
    };

    const handleOpenGuestDrawer = (guest = null) => {
        if (guest) {
            // EDIT
            setEditingGuestId(guest.id_guest);
            setGuestName(guest.guest_name || '');
            setGuestCategory(guest.id_category || '');
            const mappedInt = (guest.intolerances || []).map((dbKey) => {
                const found = Object.entries(intoleranceMap).find(([ita, eng]) => eng === dbKey);
                return found ? found[0] : dbKey;
            });
            setGuestIntolerances(mappedInt);
            setGuestOtherText(guest.other_text || '');
        } else {
            // NEW
            setEditingGuestId(null);
            setGuestName('');
            setGuestCategory('');
            setGuestIntolerances([]);
            setGuestOtherText('');
        }
        setGuestDrawerOpen(true);
    };

    const handleCloseGuestDrawer = () => {
        setGuestDrawerOpen(false);
        setEditingGuestId(null);
        setGuestName('');
        setGuestCategory('');
        setGuestIntolerances([]);
        setGuestOtherText('');
    };

    const saveGuest = async () => {
        try {
            if (!guestName.trim()) {
                showAlert('Attenzione', 'Nome obbligatorio');
                return;
            }
            const formattedName = guestName.toUpperCase();
            const mappedIntol = guestIntolerances.map((lab) => intoleranceMap[lab]);

            if (editingGuestId) {
                await api.put(`/guests/${editingGuestId}`, {
                    guest_name: formattedName,
                    id_category: guestCategory || null,
                    intolerances: mappedIntol,
                    other_text: guestOtherText || null,
                });
            } else {
                await api.post('/guests', {
                    guest_name: formattedName,
                    id_category: guestCategory || null,
                    intolerances: mappedIntol,
                    other_text: guestOtherText || null,
                });
            }
            handleCloseGuestDrawer();
            fetchGuests();
            fetchAssignedGuests();
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile salvare invitato');
        }
    };

    const handleDeleteGuest = async (guestId) => {
        try {
            await api.delete(`/guests/${guestId}`);
            fetchGuests();
            fetchAssignedGuests();
            fetchUnassignedGuestsCount();
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile eliminare invitato');
        }
    };

    // Categorie
    const handleOpenCategoryDialog = (cat = null) => {
        if (cat) {
            setEditingCategoryId(cat.id_category);
            setNewCategoryName(cat.name_categories);
        } else {
            setEditingCategoryId(null);
            setNewCategoryName('');
        }
        setCategoryDialogOpen(true);
    };

    const handleCloseCategoryDialog = () => {
        setCategoryDialogOpen(false);
        setEditingCategoryId(null);
        setNewCategoryName('');
    };

    const saveCategory = async () => {
        try {
            if (!newCategoryName.trim()) {
                showAlert('Attenzione', 'Nome gruppo non può essere vuoto');
                return;
            }
            if (editingCategoryId) {
                await api.put(`/categories/${editingCategoryId}`, {
                    name_categories: newCategoryName,
                });
            } else {
                await api.post('/categories', {
                    name_categories: newCategoryName,
                });
            }
            handleCloseCategoryDialog();
            fetchCategories();
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile salvare gruppo');
        }
    };

    const handleDeleteCategory = (catId) => {
        setConfirmAction(() => async () => {
            try {
                await api.delete(`/categories/${catId}`);
                fetchCategories();
                fetchGuests();
            } catch (error) {
                console.error(error);
                showAlert('Errore', 'Impossibile eliminare gruppo');
            }
        });
        setConfirmOpen(true);
    };

    const getGuestsByCategory = (catId) => guests.filter((g) => g.id_category === catId);
    const getGuestsWithoutCategory = () => guests.filter((g) => !g.id_category);

    const handleIntoleranceChange = (e) => {
        setGuestIntolerances(e.target.value);
        setIntoleranceSelectOpen(false);
    };

    // *** MAPPA / TAVOLI ***
    const handlePlanSwitch = (e) => {
        setCurrentPlan(e.target.checked ? 'B' : 'A');
    };

    const fetchTables = async () => {
        try {
            const res = await api.get('/tables', { params: { plan: currentPlan } });
            setTables(res.data);
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile caricare tavoli');
        }
    };

    const fetchMapTables = async () => {
        try {
            const res = await api.get('/map_tables', { params: { plan: currentPlan } });
            setMapTables(res.data);
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile caricare mappa');
        }
    };

    const handleOpenAddTableDialog = () => {
        setTableName('');
        setTableShape('rectangular');
        setAddTableDialogOpen(true);
    };

    const handleCloseAddTableDialog = () => {
        setAddTableDialogOpen(false);
    };

    const addTable = async () => {
        try {
            if (!tableName.trim()) {
                showAlert('Attenzione', 'Il nome del tavolo non può essere vuoto');
                return;
            }
            const formattedName = tableName.toUpperCase();
            const tableRes = await api.post('/tables', {
                table_name: formattedName,
                table_type: tableShape,
                order_table: orderTable,
                plan: currentPlan,
                vertical: 0,
            });
            setOrderTable(orderTable + 1);

            const newTable = tableRes.data;
            await api.post('/map_tables', {
                table_name: newTable.table_name,
                table_type: newTable.table_type,
                plan: currentPlan,
                x: 100,
                y: 100,
                rotation: 0,
                id_table: newTable.id_table,
            });

            handleCloseAddTableDialog();
            fetchTables();
            fetchMapTables();
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile creare tavolo');
        }
    };

    const setEditTableIdNameDialog = (id, name) => {
        setEditTableId(id);
        setEditTableName(name);
        setOpenEditTableDialog(true);
    };

    const updateTableName = async () => {
        try {
            if (!editTableName.trim()) {
                showAlert('Attenzione', 'Nome tavolo non può essere vuoto');
                return;
            }
            const formattedName = editTableName.toUpperCase();
            await api.put(`/tables/${editTableId}`, { table_name: formattedName });
            setOpenEditTableDialog(false);
            fetchTables();
            fetchMapTables();
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile modificare tavolo');
        }
    };

    const handleDeleteTable = (tableId) => {
        setConfirmAction(() => async () => {
            try {
                await api.delete(`/tables/${tableId}`);
                fetchTables();
                fetchMapTables();
                fetchAssignedGuests();
                fetchUnassignedGuestsCount();
            } catch (error) {
                console.error(error);
                showAlert('Errore', 'Impossibile eliminare tavolo');
            }
        });
        setConfirmOpen(true);
    };

    // Rotazione 0°/90°, ma NON per i tavoli "round"
    const rotateMapTable = async (mapTable) => {
        const foundTable = tables.find((t) => t.id_table === mapTable.id_table);
        if (!foundTable) return;
        if (foundTable.table_type === 'round') {
            // Se tondo, niente rotazione
            return;
        }
        const newRotation = mapTable.rotation === 0 ? 90 : 0;
        try {
            await api.put(`/map_tables/${mapTable.id_map_table}`, { rotation: newRotation });
            fetchMapTables();
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile ruotare tavolo');
        }
    };

    const removeMapTableOnly = async (mapTableId, tableId) => {
        try {
            await api.delete(`/map_tables/${mapTableId}`);
            await api.delete(`/tables/${tableId}`);
            fetchTables();
            fetchMapTables();
            fetchAssignedGuests();
            fetchUnassignedGuestsCount();
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile rimuovere tavolo dalla mappa');
        }
    };

    const moveMapTable = async (mapTableId, newX, newY) => {
        const foundMT = mapTables.find((m) => m.id_map_table === mapTableId);
        if (!foundMT) return;

        const foundTable = tables.find((t) => t.id_table === foundMT.id_table);
        if (!foundTable) return;

        // Salvo la posizione precedente
        const prevX = foundMT.x;
        const prevY = foundMT.y;

        // Aggiornamento ottimistico: modifico l'array locale
        foundMT.x = newX;
        foundMT.y = newY;

        try {
            await api.put(`/map_tables/${mapTableId}`, { x: newX, y: newY });
            fetchMapTables();
        } catch (error) {
            console.error(error);
            foundMT.x = prevX;
            foundMT.y = prevY;
            showAlert('Errore', 'Impossibile spostare tavolo in mappa');
        }
    };

    // DnD area
    const MapDropArea = () => {
        const [, drop] = useDrop({
            accept: ['mapTable'],
            drop: (item, monitor) => {
                const offset = monitor.getClientOffset();
                if (!mapRef.current) return;
                const mapRect = mapRef.current.getBoundingClientRect();
                if (!mapRect) return;

                const x = offset.x - mapRect.left - 40;
                const y = offset.y - mapRect.top - 40;
                moveMapTable(item.id, x, y);
            },
        });

        return (
            // MODIFICA: tolto overflow: 'hidden' e altezza fissa sostituita con minHeight
            <Box
                ref={drop}
                sx={{
                    width: '100%',
                    minHeight: isSmallScreen ? 400 : 700,
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ccc',
                    borderRadius: 2,
                    position: 'relative',
                }}
            >
                {mapTables.map((mt) => (
                    <DraggableMapTable
                        key={mt.id_map_table}
                        mapTable={mt}
                        tables={tables}
                        rotateMapTable={rotateMapTable}
                        removeMapTableOnly={removeMapTableOnly}
                        setSelectedTable={setSelectedTable}
                        setTableCardOpen={setTableCardOpen}
                        assignedGuests={assignedGuests}
                        getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                        globalIndexesMap={globalIndexesMap}
                        isMobile={isMobile}
                    />
                ))}
            </Box>
        );
    };

    const getGuestsByTableAndOrder = (tableId, tableOrder) => {
        return assignedGuests
            .filter((g) => g.id_table === tableId && g.table_order === tableOrder)
            .sort((a, b) => a.table_side_position - b.table_side_position);
    };

    const fetchAssignedGuests = async () => {
        try {
            const res = await api.get('/guests/assigned', { params: { plan: currentPlan } });
            setAssignedGuests(res.data);
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Errore durante il recupero degli invitati assegnati');
        }
    };

    const fetchUnassignedGuestsCount = async () => {
        try {
            const res = await api.get('/guests/unassigned/count', {
                params: { plan: currentPlan },
            });
            setUnassignedGuestsCount(res.data.count);
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Errore durante il recupero del numero di invitati da assegnare');
        }
    };

    // Assegnazione Indice Globale
    const assignGlobalIndexes = (allTables, allGuests) => {
        const sortedTables = [...allTables].sort((a, b) => a.id_table - b.id_table);

        let globalCounter = 1;
        const resultMap = {};

        const orderRectOrS = (guestsForTable) => {
            const top = guestsForTable
                .filter((g) => g.table_order === 1)
                .sort((a, b) => a.table_side_position - b.table_side_position);
            const left = guestsForTable
                .filter((g) => g.table_order === 2)
                .sort((a, b) => a.table_side_position - b.table_side_position);
            const right = guestsForTable
                .filter((g) => g.table_order === 4)
                .sort((a, b) => a.table_side_position - b.table_side_position);
            const bottom = guestsForTable
                .filter((g) => g.table_order === 3)
                .sort((a, b) => a.table_side_position - b.table_side_position);
            return [...top, ...left, ...right, ...bottom];
        };

        const orderRound = (guestsForTable) =>
            guestsForTable.sort((a, b) => a.table_side_position - b.table_side_position);

        for (const t of sortedTables) {
            const guestsForThisTable = allGuests.filter((g) => g.id_table === t.id_table);

            let orderedGuests = [];
            if (t.table_type === 'round') {
                orderedGuests = orderRound(guestsForThisTable);
            } else {
                orderedGuests = orderRectOrS(guestsForThisTable);
            }

            for (const guest of orderedGuests) {
                resultMap[guest.id_guest] = globalCounter;
                globalCounter++;
            }
        }
        return resultMap;
    };

    useEffect(() => {
        if (tables.length > 0 && assignedGuests.length > 0) {
            const assigned_Guests = assignedGuests.filter((g) => g.id_table);
            const newMap = assignGlobalIndexes(tables, assigned_Guests);
            setGlobalIndexesMap(newMap);
        } else {
            setGlobalIndexesMap({});
        }
    }, [tables, assignedGuests]);

    const closeTableCard = () => {
        setSelectedTable(null);
        setTableCardOpen(false);
    };

    const handleTableCardDelete = (tableId) => {
        setConfirmAction(() => async () => {
            try {
                await api.delete(`/tables/${tableId}`);
                fetchTables();
                fetchMapTables();
                fetchAssignedGuests();
                fetchUnassignedGuestsCount();
                closeTableCard();
            } catch (error) {
                console.error(error);
                showAlert('Errore', 'Impossibile eliminare tavolo');
            }
        });
        setConfirmOpen(true);
    };

    const handleEditTable = (tableId) => {
        const found = tables.find((t) => t.id_table === tableId);
        if (!found) return;
        setEditTableId(found.id_table);
        setEditTableName(found.table_name);
        setOpenEditTableDialog(true);
    };

    // *** EXPORT EXCEL & PDF ***
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    function mapTableName(value) {
        const tableNameMap = {
            rectangular: 'Tavolo Rettangolare',
            round: 'Tavolo Tondo',
            s_shaped: 'Tavolo a S',
        };
        return tableNameMap[value] || 'Valore non valido';
    }

    function mapTableOrder(value) {
        const tableOrderMap = {
            0: '-',
            1: 'Capotavola Alto',
            2: 'Lato Lungo Destro',
            3: 'Capotavola Basso',
            4: 'Lato Lungo Sinistro',
        };
        return tableOrderMap[value] || 'Valore non valido';
    }

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

    const downloadTablesExcel = async () => {
            setIsGeneratingExcel(true);
            try {
                // (facoltativo: ricarica i dati prima)
                await fetchTables();
                await fetchMapTables();
                await fetchAssignedGuests();
                await fetchUnassignedGuestsCount();
    
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('DisposizioneTavoli');
    
                // Impostiamo le colonne base
                worksheet.columns = [
                    { header: 'N. Invitato', key: 'global_index', width: 10 },
                    { header: 'Nome Tavolo', key: 'table_name', width: 20 },
                    { header: 'Tipo', key: 'table_type', width: 15 },
                    { header: 'Lato', key: 'table_position', width: 35 },
                    { header: 'Posto', key: 'table_side_position', width: 10 },
                    { header: 'Nome', key: 'guest_name', width: 20 },
                    { header: 'Intolleranze', key: 'intolerances', width: 30 },
                    { header: 'Testo altro', key: 'testo_altro', width: 20 },
                ];
    
                // Per ogni tavolo, otteniamo i guests assegnati
                for (let t of tables) {
                    const tableGuests = assignedGuests.filter((g) => g.id_table === t.id_table);
    
                    // Se non ci sono invitati, riga "vuota"
                    if (tableGuests.length === 0) {
                        worksheet.addRow({
                            global_index: '',
                            table_name: t.table_name,
                            table_type: mapTableName(t.table_type),
                            table_position: '',
                            table_side_position: '',
                            guest_name: '---',
                            intolerances: '',
                            testo_altro: '',
                        });
                        continue;
                    }
    
                    // Altrimenti aggiungiamo una row per ogni invitato
                    for (let g of tableGuests) {
                        worksheet.addRow({
                            global_index: globalIndexesMap[g.id_guest] || '',
                            table_name: t.table_name,
                            table_type: mapTableName(t.table_type),
                            table_position: `${mapTableOrder(g.table_order)}`,
                            table_side_position: `Pos: ${g.table_side_position}`,
                            guest_name: g.guest_name,
                            intolerances: g.intolerances?.length
                                ? g.intolerances.map(mapIntolerance).join(', ')
                                : '',
                            testo_altro: g.other_text || '',
                        });
                    }
                }
    
                // Bordi di ogni cella (opzionale)
                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin' },
                            bottom: { style: 'thin' },
                            left: { style: 'thin' },
                            right: { style: 'thin' },
                        };
                    });
                });
    
                // Genera il file
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const dateStr = new Date(eventDate).toLocaleDateString('it-IT');
                link.download = `Tavoli_${eventName}_${dateStr}_PIANO-${currentPlan}.xlsx`;
                link.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Errore generazione Excel:', error);
                showAlert('Errore', 'Impossibile generare il file Excel');
            }
            setIsGeneratingExcel(false);
        };

    const downloadMapPDF = async () => {
        try {
            setIsGeneratingPDF(true);
            if (!mapRef.current) return;

            // 1) Cattura screenshot della mappa con html-to-image
            const dataUrl = await toPng(mapRef.current, {
                scrollX: 0,
                scrollY: 0,
                canvasWidth: mapRef.current.scrollWidth * 2,
                canvasHeight: mapRef.current.scrollHeight * 2,
                // Altre opzioni (es. backgroundColor) se necessario
            });
            // toPng restituisce direttamente una dataURL
            const imgData = dataUrl;

            // 2) Recupera informazioni su ogni tavolo (codice invariato)
            const tableStats = [];
            for (const mt of tables) {
                let nGuests = 0;
                let variantsCount = {};

                try {
                    const url = `/guests/assigned/${mt.id_table}`;
                    const res = await api.get(url, { params: { plan: currentPlan } });
                    const assigned = res.data || [];
                    nGuests = assigned.length;

                    assigned.forEach((guest) => {
                        if (guest.intolerances) {
                            guest.intolerances.forEach((intol) => {
                                if (!variantsCount[intol]) variantsCount[intol] = 0;
                                variantsCount[intol]++;
                            });
                        }
                    });
                } catch (error) {
                    console.error('Errore recupero invitati su tavolo: ', mt.table_name);
                }

                tableStats.push({
                    tableName: mt.table_name || 'Senza Nome',
                    guestsNumber: nGuests,
                    variants: variantsCount,
                });
            }

            // 3) Crea il PDF con jsPDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${eventName}`, 105, 10, { align: 'center' });
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Data Evento: ${eventDate} - Piano: ${currentPlan}`, 105, 17, { align: 'center' });

            // Recupera le proprietà dell'immagine per scalare correttamente
            const { width: realWidth, height: realHeight } = pdf.getImageProperties(imgData);
            const scaleFactor = 190 / realWidth; // 190mm = larghezza usata sotto
            const finalImgHeight = realHeight * scaleFactor;

            pdf.addImage(imgData, 'PNG', 10, 30, 190, 0);

            // 4) Aggiungi la tabella dei tavoli
            let yPos = 125; // Posizione di partenza per la tabella

            // Se l'immagine occupa più spazio, sposta la tabella più in basso
            const bottomOfImage = 30 + finalImgHeight + 10; // +10 mm di margine
            if (bottomOfImage > yPos) {
                yPos = bottomOfImage;
            }

            pdf.setFontSize(10);
            pdf.setTextColor('#000');
            pdf.setDrawColor(120, 140, 60);

            // Intestazione della colonna "Nome Tavolo (n. invitati)"
            pdf.setFillColor(200, 230, 200);
            pdf.rect(10, yPos, 90, 10, 'FD');
            pdf.text('Nome Tavolo (n. invitati)', 12, yPos + 7);

            // Ripristina il colore di riempimento prima del secondo rettangolo
            pdf.setFillColor(200, 230, 200);
            pdf.rect(100, yPos, 100, 10, 'FD');
            pdf.text('Varianti Menù', 102, yPos + 7)

            yPos += 10;

            tableStats.forEach((ts) => {
                // Riga per nome tavolo e numero di invitati
                pdf.rect(10, yPos, 90, 10);
                pdf.text(`${ts.tableName} (${ts.guestsNumber})`, 12, yPos + 7);

                // Prepara la stringa per le varianti del menù
                const variantsArr = [];
                Object.entries(ts.variants).forEach(([variant, count]) => {
                    variantsArr.push(`${mapIntolerance(variant)}(${count})`);
                });
                const variantsStr = variantsArr.join(', ');

                pdf.rect(100, yPos, 100, 10);
                pdf.text(variantsStr || '-', 102, yPos + 7);

                yPos += 10;
                if (yPos > 280) {
                    pdf.addPage();
                    yPos = 10;
                }
            });

            // 5) Salva il PDF
            pdf.save(`Mappa_${eventName}_${eventDate}_PIANO-${currentPlan}.pdf`);
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile generare PDF');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // *** RENDER PRINCIPALE ***
    return (
        <DndProvider backend={dndBackend}>
            <Container maxWidth="xl">
                    {/* Titolo / Data */}
                    <Box textAlign="center" mb={3} paddingTop={2}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#788c3c' }}>
                            {eventName || 'NOME EVENTO'}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {eventDate || 'DATA EVENTO'}
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* SINISTRA: INVITATI */}
                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    backgroundColor: '#fff',
                                    color: '#788c3c',
                                    //border: 1,
                                    //borderColor: '#ccc',
                                    p: 2,
                                    borderTopLeftRadius: 6,
                                    borderTopRightRadius: 6,
                                    //boxShadow: 1,
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    {/* Titolo lista + conteggio */}
                                    <Typography variant="h6">
                                        Lista Invitati
                                    </Typography>

                                    {/* MODIFICA: rimosso IconButton con +, sostituito con Button */}
                                    <Button
                                        size="medium"
                                        startIcon={<AddCircleOutline />}
                                        onClick={() => handleOpenGuestDrawer(null)}
                                        sx={{
                                            backgroundColor: 'white',
                                            color: '#788c3c',
                                            ':hover': { backgroundColor: '#f0f0f0' },
                                        }}
                                    >
                                        Aggiungi Invitato
                                    </Button>
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    backgroundColor: '#fff',
                                    p: 2,
                                    borderBottomLeftRadius: 6,
                                    borderBottomRightRadius: 6,
                                    boxShadow: 2,
                                }}
                            >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} borderBottom={1} borderColor="#ccc" paddingBlockEnd={1}> 
                                    <Typography variant="body1" fontWeight="bold">
                                        Organizza in gruppi
                                    </Typography>
                                    <Button
                                        size="medium"
                                        startIcon={<AddCircleOutline />}
                                        onClick={() => handleOpenCategoryDialog(null)}
                                        sx={{
                                            backgroundColor: 'white',
                                            color: '#788c3c',
                                            ':hover': { backgroundColor: '#f0f0f0' },
                                        }}
                                    >
                                        Crea Gruppo
                                    </Button>
                                </Box>

                            <Box sx={{ maxHeight: isSmallScreen ? 300 : 600, overflowY: 'auto' }}>
                                {/* Categorie */}
                                {categories.map((cat) => (
                                    <Box
                                        key={cat.id_category}
                                        sx={{
                                            backgroundColor: '#fff',
                                            //borderRadius: 4,
                                            mb: 2,
                                            mr: 1,
                                            p: 1,
                                            marginBottom: 1,
                                            //boxShadow: 2,
                                            //border: '2px solid #eee', 
                                        }}
                                    >
                                        <Box
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            mb={1}
                                            borderBottom={1} borderColor="#ccc"
                                        >
                                            <Typography variant="subtitle1" fontWeight="bold" color='#788c3c'>
                                                {cat.name_categories}
                                            </Typography>
                                            <Box>
                                                <Tooltip title="Modifica Gruppo">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenCategoryDialog(cat)}
                                                        sx={{
                                                            color: '#788c3c',
                                                            ':hover': { backgroundColor: '#f0f0f0' }, }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Elimina Gruppo">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteCategory(cat.id_category)}
                                                        sx={{
                                                            color: '#D70040',
                                                            ':hover': { backgroundColor: '#f0f0f0' },
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>

                                        {/* Invitati del gruppo */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }} /*borderBottom={2} borderColor="#788c3c"*/>
                                            {getGuestsByCategory(cat.id_category).map((g) => (
                                                <Box
                                                    key={g.id_guest}
                                                    sx={{
                                                        backgroundColor: '#fff',
                                                        //borderRadius: 2,
                                                        p: '2px 14px 0px 2px', 
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        width: '100%',
                                                        ':hover': { backgroundColor: '#f0f0f0' },
                                                        //boxShadow: 1,
                                                        //border: '1px solid #eee',
                                                    }}
                                                >
                                                    {/* Nome + Intolleranze */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => handleOpenGuestDrawer(g)}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ fontWeight: 'bold', mr: 0.5, cursor: 'pointer' }}
                                                        >
                                                            {g.guest_name}
                                                        </Typography>
                                                        {(g.intolerances || []).map((dbKey) => (
                                                            <Tooltip key={dbKey} title={mapIntolerance(dbKey)}>
                                                                <img
                                                                    src={`/icons/${dbKey}.png`}
                                                                    alt={dbKey}
                                                                    style={{ width: 20, height: 20, marginLeft: 2 }}
                                                                />
                                                            </Tooltip>
                                                        ))}
                                                    </Box>

                                                    {/* Icona Elimina */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteGuest(g.id_guest)}
                                                        sx={{
                                                            color: '#D70040',
                                                            ':hover': { backgroundColor: '#f0f0f0' },
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}

                                {/* Invitati senza gruppo */}
                                <Box
                                    sx={{
                                        backgroundColor: '#fff',
                                        //borderRadius: 4,
                                        mb: 2,
                                        mr: 1,
                                        p: 1,
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                        Senza Gruppo
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {getGuestsWithoutCategory().map((g) => (
                                            <Box
                                                key={g.id_guest}
                                                sx={{
                                                    backgroundColor: '#fff',
                                                    //borderRadius: 2,
                                                    p: '2px 14px 0px 2px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    width: '100%',
                                                    ':hover': { backgroundColor: '#f0f0f0' },
                                                    //boxShadow: 1,
                                                    //border: '1px solid #eee',
                                                }}
                                            >
                                                {/* Nome + Intolleranze */}
                                                <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => handleOpenGuestDrawer(g)}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ fontWeight: 'bold', mr: 0.5, cursor: 'pointer' }}
                                                    >
                                                        {g.guest_name}
                                                    </Typography>
                                                    {(g.intolerances || []).map((dbKey) => (
                                                        <Tooltip key={dbKey} title={mapIntolerance(dbKey)}>
                                                            <img
                                                                src={`/icons/${dbKey}.png`}
                                                                alt={dbKey}
                                                                style={{ width: 20, height: 20, marginLeft: 2 }}
                                                            />
                                                        </Tooltip>
                                                    ))}
                                                </Box>

                                                {/* Icona Elimina */}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteGuest(g.id_guest)}
                                                    sx={{
                                                        color: '#D70040',
                                                        ':hover': { backgroundColor: '#f0f0f0' },
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>


                                {/* MODIFICA: aggiunta riga finale con totale invitati */}
                                <Box mt={2} textAlign="right">
                                    <Typography variant="body2" fontWeight="bold">
                                        N. Totale Invitati: {guests.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {/* DESTRA: MAPPA */}
                        <Grid item xs={12} md={8}>
                            <Box
                                sx={{
                                    backgroundColor: 'white',
                                    color: '#788c3c',
                                    p: 2,
                                    borderTopLeftRadius: 6,
                                    borderTopRightRadius: 6,
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Mappa</Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={currentPlan === 'B'}
                                                    onChange={handlePlanSwitch}
                                                    sx={{
                                                        '& .MuiSwitch-thumb': {
                                                            color: '#788c3c',
                                                        },
                                                        '&.Mui-checked .MuiSwitch-thumb': {
                                                            color: '#788c3c',
                                                        },
                                                        '& .MuiSwitch-track': {
                                                            backgroundColor: '#d3d3d3', // grigio chiaro
                                                        },
                                                        '&.Mui-checked .MuiSwitch-track': {
                                                            backgroundColor: '#d3d3d3', // mantenere lo stesso colore anche quando è attivo
                                                        },
                                                    }}
                                                />
                                            }
                                            label="Piano A/B"
                                        sx={{ color: '#788c3c' }}
                                        />

                                        <Tooltip title="Scarica Excel Tavoli">
                                        <IconButton sx={{ color: '#788c3c' }} onClick={downloadTablesExcel}>
                                                <GetAppIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Scarica PDF Mappa">
                                            <IconButton
                                            sx={{ color: '#788c3c' }}
                                                onClick={downloadMapPDF}
                                                disabled={isGeneratingPDF}
                                            >
                                                <PictureAsPdfIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Button
                                            size="medium"
                                            startIcon={<AddCircleOutline />}
                                            onClick={handleOpenAddTableDialog}
                                            sx={{
                                                backgroundColor: 'white',
                                                color: '#788c3c',
                                                ':hover': { backgroundColor: '#f0f0f0' },
                                            }}
                                        >
                                            Aggiungi Tavolo
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                            <Box ref={mapRef}>
                                <MapDropArea />
                            </Box>
                        </Grid>
                    </Grid>
            </Container>

            {/* ------ DRAWER INVITATO ------ */}
            <Drawer anchor="left" open={guestDrawerOpen} onClose={handleCloseGuestDrawer}>
                <Box sx={{ width: 300, p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {editingGuestId ? 'Modifica Invitato' : 'Aggiungi Invitato'}
                        </Typography>
                        <IconButton onClick={handleCloseGuestDrawer}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box mt={2}>
                        <TextField
                            label="Nome *"
                            fullWidth
                            margin="normal"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="cat-label">Gruppo</InputLabel>
                            <Select
                                labelId="cat-label"
                                value={guestCategory || ''}
                                label="Gruppo"
                                onChange={(e) => setGuestCategory(e.target.value)}
                            >
                                <MenuItem value="">Nessun gruppo</MenuItem>
                                {categories.map((c) => (
                                    <MenuItem key={c.id_category} value={c.id_category}>
                                        {c.name_categories}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Intolleranze */}
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="intol-label" sx={{ top: -4 }}>
                                Intolleranze
                            </InputLabel>
                            <Select
                                labelId="intol-label"
                                multiple
                                open={intoleranceSelectOpen}
                                onOpen={() => setIntoleranceSelectOpen(true)}
                                onClose={() => setIntoleranceSelectOpen(false)}
                                value={guestIntolerances}
                                onChange={handleIntoleranceChange}
                                renderValue={(selected) => selected.join(', ')}
                            >
                                {intoleranceLabels.map((label) => (
                                    <MenuItem key={label} value={label}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {guestIntolerances.includes('Altro') && (
                            <TextField
                                label="Specifica altra intolleranza"
                                fullWidth
                                margin="normal"
                                value={guestOtherText}
                                onChange={(e) => setGuestOtherText(e.target.value)}
                            />
                        )}

                        <Button
                            fullWidth
                            sx={{
                                mt: 2,
                                backgroundColor: '#788c3c',
                                color: 'white',
                                ':hover': { backgroundColor: '#657a33' },
                            }}
                            onClick={saveGuest}
                        >
                            {editingGuestId ? 'Salva Modifiche' : 'Aggiungi Invitato'}
                        </Button>
                    </Box>
                </Box>
            </Drawer>

            {/* ------ DIALOG CATEGORIA ------ */}
            <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog}>
                <DialogTitle>{editingCategoryId ? 'Modifica Gruppo' : 'Crea Gruppo'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nome Gruppo"
                        fullWidth
                        margin="normal"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCategoryDialog}>Annulla</Button>
                    <Button
                        onClick={saveCategory}
                        variant="contained"
                        sx={{ backgroundColor: '#788c3c', color: 'white' }}
                    >
                        {editingCategoryId ? 'Salva' : 'Crea'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ------ DIALOG AGGIUNGI TAVOLO ------ */}
            <Dialog open={addTableDialogOpen} onClose={handleCloseAddTableDialog}>
                <DialogTitle>Aggiungi Tavolo</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nome Tavolo"
                        fullWidth
                        margin="normal"
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value.toUpperCase())}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="table-shape-label">Forma Tavolo</InputLabel>
                        <Select
                            labelId="table-shape-label"
                            value={tableShape}
                            label="Forma Tavolo"
                            onChange={(e) => setTableShape(e.target.value)}
                        >
                            <MenuItem value="rectangular">Tavolo Rettangolare</MenuItem>
                            <MenuItem value="s_shaped">Tavolo a S</MenuItem>
                            <MenuItem value="round">Tavolo Tondo</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddTableDialog}>Annulla</Button>
                    <Button
                        onClick={addTable}
                        variant="contained"
                        sx={{ backgroundColor: '#788c3c', color: 'white' }}
                    >
                        Crea
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ------ DIALOG EDIT TAVOLO ------ */}
            <Dialog open={openEditTableDialog} onClose={() => setOpenEditTableDialog(false)}>
                <DialogTitle>Modifica Tavolo</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nome Tavolo"
                        fullWidth
                        margin="normal"
                        value={editTableName}
                        onChange={(e) => setEditTableName(e.target.value.toUpperCase())}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditTableDialog(false)}>Annulla</Button>
                    <Button
                        onClick={updateTableName}
                        variant="contained"
                        sx={{ backgroundColor: '#788c3c', color: 'white' }}
                    >
                        Salva
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ------ DIALOG TABLECARD ------ */}
            <Dialog
                open={tableCardOpen && selectedTable !== null}
                onClose={closeTableCard}
                fullWidth
                maxWidth="md"
            >
                <DialogContent>
                <IconButton
                        aria-label="close"
                        onClick={closeTableCard}
                        sx={{
                            position: 'absolute',
                            right: 1,
                            top: 1,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {selectedTable && (
                        <TableCard
                            table={selectedTable}
                            guests={assignedGuests}
                            getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                            handleDeleteClick={handleTableCardDelete}
                            setEditTableId={handleEditTable}
                            editTableName={editTableName}
                            setEditTableName={setEditTableName}
                            setOpenEditTableDialog={setOpenEditTableDialog}
                            currentPlan={currentPlan}
                            fetchAssignedGuests={fetchAssignedGuests}
                            fetchUnassignedGuestsCount={fetchUnassignedGuestsCount}
                            globalIndexesMap={globalIndexesMap}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ------ ALERT ------ */}
            <AlertModal
                open={alertOpen}
                onClose={() => setAlertOpen(false)}
                title={alertTitle}
                message={alertMessage}
            />

            {/* ------ CONFIRM DIALOG ------ */}
            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => {
                    confirmAction();
                    setConfirmOpen(false);
                }}
                title="Conferma Operazione"
                content="Sei sicuro di voler procedere?"
            />

            {/* ------ CHAT ------ */}
            <Chat />
        </DndProvider>
    );
}

/* ------------------------------------------------------------------ */
/* ------------------- DRAGGABLE MAP TABLE -------------------------- */
/* ------------------------------------------------------------------ */

function DraggableMapTable({
    mapTable,
    tables,
    rotateMapTable,
    removeMapTableOnly,
    setSelectedTable,
    setTableCardOpen,
    assignedGuests,
    getGuestsByTableAndOrder,
    globalIndexesMap,
    isMobile,
}) {
    const [{ isDragging }, dragRef] = useDrag({
        type: 'mapTable',
        item: { id: mapTable.id_map_table },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const handleTableClick = (e) => {
        e.stopPropagation();
        const foundTable = tables.find((t) => t.id_table === mapTable.id_table);
        if (!foundTable) return;
        setSelectedTable(foundTable);
        setTableCardOpen(true);
    };

    const foundTable = tables.find((t) => t.id_table === mapTable.id_table);

    const dimensionWidth = isMobile ? 180 : 230;
    const dimensionHeight = isMobile ? 160 : 180;
    const containerSizeWidth = dimensionWidth;
    const containerSizeHeight = foundTable && foundTable.table_type === 'round' ? dimensionHeight : (isMobile ? 130 : 150);

    const scaleFactor = 0.80;

    return (
        <div
            ref={dragRef}
            style={{
                position: 'absolute',
                top: mapTable.y,
                left: mapTable.x,
                cursor: 'move',
                opacity: isDragging ? 0.5 : 1,
            }}
        >
            <div style={{ transform: `scale(${scaleFactor})`, transformOrigin: 'top left' }}>
                <div
                    style={{
                        width: `${containerSizeWidth}px`,
                        height: `${containerSizeHeight}px`,
                        //backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Barra con nome tavolo e pulsanti */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0px 6px',
                            //backgroundColor: '#788c3c',
                            height: '24px',
                            zIndex: 999,
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: 'lighter',
                                color: 'black',
                                maxWidth: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                            title={foundTable ? foundTable.table_name : ''}
                        >
                            {foundTable?.table_name || '...'}
                        </div>

                        <div style={{ display: 'flex', gap: '4px', color: 'white' }}>
                            {foundTable && foundTable.table_type !== 'round' && (
                                <Tooltip title="Ruota Tavolo">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            rotateMapTable(mapTable);
                                        }}
                                    >
                                        <RotateRight fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            { /* MODIFICA: rimosso pulsante per eliminare tavolo
                            <Tooltip title="Rimuovi Tavolo">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeMapTableOnly(mapTable.id_map_table, mapTable.id_table);
                                    }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            */}
                        </div>
                    </div>

                    {/* Preview Tavolo */}
                    <div
                        onClick={handleTableClick}
                        style={{
                            position: 'absolute',
                            top: foundTable?.table_type === 'round' ? 0 : 16 ,
                            left: 0,
                            width: '100%',
                            height: `calc(100% - 32px)`,
                            transform: `rotate(${mapTable.rotation}deg)`,
                            transformOrigin: 'center center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {foundTable && (
                            <MiniTablePreview
                                table={foundTable}
                                assignedGuests={assignedGuests}
                                getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                                globalIndexesMap={globalIndexesMap}
                                containerSizeWidth={containerSizeWidth - 10}
                                containerSizeHeight={containerSizeHeight - 8}
                                rotation={mapTable.rotation}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------
   MINI PREVIEW: rotondo o rettangolare
------------------------------------------------------------------ */
function MiniTablePreview({
    table,
    assignedGuests,
    getGuestsByTableAndOrder,
    globalIndexesMap,
    containerSizeWidth,
    containerSizeHeight,
    rotation,
}) {
    if (!table) return null;

    if (table.table_type === 'round') {
        return (
            <MiniRoundPreview
                table={table}
                getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                globalIndexesMap={globalIndexesMap}
                containerSizeWidth={containerSizeWidth}
                containerSizeHeight={containerSizeHeight + 16}
            />
        );
    } else {
        return (
            <MiniRectPreview
                table={table}
                getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                globalIndexesMap={globalIndexesMap}
                containerSizeWidth={containerSizeWidth}
                containerSizeHeight={containerSizeHeight}
                rotation={rotation}
            />
        );
    }
}

/* ------------------------------------------------------------------
   MINI TAVOLO RETTANGOLARE / S
------------------------------------------------------------------ */
function MiniRectPreview({
    table,
    getGuestsByTableAndOrder,
    globalIndexesMap,
    containerSizeWidth,
    containerSizeHeight,
    rotation,
}) {
    const topGuests = getGuestsByTableAndOrder(table.id_table, 1);
    const leftGuests = getGuestsByTableAndOrder(table.id_table, 2);
    const bottomGuests = getGuestsByTableAndOrder(table.id_table, 3);
    const rightGuests = getGuestsByTableAndOrder(table.id_table, 4);

    function truncateList(arr) {
        if (arr.length <= 2) return arr;
        return [arr[0], { id_guest: '...', guest_name: '...' }, arr[arr.length - 1]];
    }
    const topShort = truncateList(topGuests);
    const leftShort = truncateList(leftGuests);
    const bottomShort = truncateList(bottomGuests);
    const rightShort = truncateList(rightGuests);

    const TABLE_WIDTH = 60;
    const TABLE_HEIGHT = 80;
    const centerX = (containerSizeWidth - TABLE_WIDTH) / 2;
    const centerY = (containerSizeHeight - TABLE_HEIGHT) / 2;

    let topOffset = centerY - 25;
    let bottomOffset = centerY + TABLE_HEIGHT + 5;
    let horizontalGap = '4px';
    let verticalGap = '4px';

    if (rotation === 90) {
        topOffset = centerY - 60;
        bottomOffset = centerY + TABLE_HEIGHT;
        horizontalGap = '8px';
        verticalGap = '1px';
    }

    const isS = table.table_type === 's_shaped';

    return (
        <div
            style={{
                position: 'relative',
                width: containerSizeWidth,
                height: containerSizeHeight,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: centerY,
                    left: centerX,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                }}
            >
                {isS ? (
                    <img
                        src="/S.svg"
                        alt="Tavolo a S"
                        style={{
                            width: TABLE_WIDTH,
                            height: TABLE_HEIGHT,
                            objectFit: 'fill',
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center center',
                        }}
                    />
                ) : (
                    <svg
                        width={TABLE_WIDTH}
                        height={TABLE_HEIGHT}
                        style={{
                            backgroundColor: '#ddd',
                            borderRadius: '4px',
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center center',
                        }}
                    />
                )}
            </div>

            {/* TOP seats */}
            <div
                style={{
                    position: 'absolute',
                    top: topOffset,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: horizontalGap,
                }}
            >
                {topShort.map((g, idx) =>
                    renderRectSeat(g, idx, globalIndexesMap, rotation)
                )}
            </div>

            {/* BOTTOM seats */}
            <div
                style={{
                    position: 'absolute',
                    top: bottomOffset,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: horizontalGap,
                }}
            >
                {bottomShort.map((g, idx) =>
                    renderRectSeat(g, idx, globalIndexesMap, rotation)
                )}
            </div>

            {/* LEFT seats */}
            {
                rotation === 90 ? (
                    <div
                        style={{
                            position: 'absolute',
                            left: centerX - 20,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: verticalGap,
                        }}
                    >
                        {leftShort.map((g, idx) =>
                            renderRectSeat(g, idx, globalIndexesMap, rotation)
                        )}
                    </div>
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            left: centerX - 60,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: verticalGap,
                        }}
                    >
                        {leftShort.map((g, idx) =>
                            renderRectSeat(g, idx, globalIndexesMap, rotation)
                        )}
                    </div>
                )
            }

            {/* RIGHT seats */}
            <div
                style={{
                    position: 'absolute',
                    left: centerX + TABLE_WIDTH + 5,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: verticalGap,
                }}
            >
                {rightShort.map((g, idx) =>
                    renderRectSeat(g, idx, globalIndexesMap, rotation)
                )}
            </div>
        </div>
    );
}

function renderRectSeat(g, idx, globalIndexesMap, rotation) {
    // Funzione per troncare la stringa a "n" caratteri, aggiungendo "..." se supera la lunghezza
    const truncate = (str, n = 5) => {
        if (!str) return "";
        return str.length > n ? str.substring(0, n) + ".." : str;
    };

    const content =
        g.id_guest === '...' ? (
            '...'
        ) : (
            <>
                {globalIndexesMap[g.id_guest] && (
                    <span style={{ fontWeight: 'bold' }}>
                        {globalIndexesMap[g.id_guest]}
                    </span>
                )}
                {' - '}
                {truncate(g.guest_name)}
            </>
        );

    if (rotation === 90) {
        return (
            <div
                key={g.id_guest}
                style={{
                    width: '20px',
                    height: '60px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #999',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                }}
                title={g.guest_name}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -60%) rotate(270deg)',
                        transformOrigin: 'center',
                        fontSize: '10px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline',
                    }}
                >
                    {content}
                </div>
            </div>
        );
    }else{
        return (
            <div
                key={g.id_guest}
                style={{
                    width: '60px',
                    height: '20px',
                    border: '1px solid #999',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    fontSize: '10px',
                    textAlign: 'center',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    display: 'inline',
                }}
                title={g.guest_name}
            >
                {content}
            </div>
        );
    }
}

/* ------------------------------------------------------------------
   MINI TAVOLO ROTONDO
------------------------------------------------------------------ */
function MiniRoundPreview({
    table,
    getGuestsByTableAndOrder,
    globalIndexesMap,
    containerSizeWidth,
    containerSizeHeight,
}) {
    const roundGuests = getGuestsByTableAndOrder(table.id_table, 0);

    const center = containerSizeWidth / 2;
    const TABLE_DIAM = 60;
    const radius = 70;
    const angleStep = (2 * Math.PI) / 12;

    return (
        <div
            style={{
                width: containerSizeWidth,
                height: containerSizeHeight,
                position: 'relative',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: center - TABLE_DIAM / 2,
                    left: center - TABLE_DIAM / 2,
                    width: TABLE_DIAM,
                    height: TABLE_DIAM,
                    backgroundColor: '#ddd',
                    borderRadius: '50%',
                }}
            />

            {roundGuests.slice(0, 12).map((g, idx) => {
                const angle = (g.table_side_position-1) * angleStep - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return renderRoundSeat(g, idx, globalIndexesMap, x, y);
            })}
        </div>
    );
}

function renderRoundSeat(g, idx, globalIndexesMap, x, y) {
    const truncate = (str, n=7) => {
        if (!str) return "";
        return str.length > n ? str.substring(0, n) + "..." : str;
    };

    if (g.id_guest === '...') {
        return (
            <div
                key={`dots-${idx}`}
                style={{
                    position: 'absolute',
                    top: y,
                    left: x,
                    transform: 'translate(-50%, -50%)',
                    fontSize: '10px',
                    border: '1px solid #999',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    padding: '2px 4px',
                    maxWidth: '60px',
                    textAlign: 'center',
                    display: 'inline',
                }}
            >
                ...
            </div>
        );
    }
    const globalIndex = globalIndexesMap[g.id_guest];
    return (
        <div
            key={g.id_guest}
            style={{
                position: 'absolute',
                top: y,
                left: x,
                transform: 'translate(-50%, -50%)',
                fontSize: '10px',
                border: '1px solid #999',
                borderRadius: '4px',
                backgroundColor: '#fff',
                padding: '2px 4px',
                maxWidth: '60px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'inline',
            }}
            title={g.guest_name}
        >
            {globalIndex && (
                <span style={{ fontWeight: 'bold' }}>{globalIndex}</span>
            )}
            {" - "}
            {truncate(g.guest_name)}
        </div>
    );
}

export default withAuth(OnePageEvent);
