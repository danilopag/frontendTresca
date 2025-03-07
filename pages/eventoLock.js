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
    Switch,
    FormControlLabel,
    useMediaQuery,
} from '@mui/material';

import {
    GetApp as GetAppIcon,
    PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';

import { DndProvider} from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

import withAuth from '../components/withAuth';
import Chat from '../components/Chat';
import AlertModal from '../components/AlertModal';

import api from '../utils/api';

/* ----- SFONDO / OVERLAY ----- */
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

function EventoLock() {
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

    // *** MAPPA / TAVOLI ***
    const [currentPlan, setCurrentPlan] = useState('A');
    const [tables, setTables] = useState([]);
    const [assignedGuests, setAssignedGuests] = useState([]);
    const [unassignedGuestsCount, setUnassignedGuestsCount] = useState(0);
    const [mapTables, setMapTables] = useState([]);
    const mapRef = useRef(null);

    // Mappa degli indici globali (per numerazione univoca degli invitati ai tavoli)
    const [globalIndexesMap, setGlobalIndexesMap] = useState({});

    // *** ALERT ***
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

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

    // -------------------- FETCH FUNZIONI --------------------
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

    // -------------------- UTILS PER LISTA --------------------
    const getGuestsByCategory = (catId) => guests.filter((g) => g.id_category === catId);
    const getGuestsWithoutCategory = () => guests.filter((g) => !g.id_category);

    // -------------------- SWITCH PIANO --------------------
    const handlePlanSwitch = (e) => {
        setCurrentPlan(e.target.checked ? 'B' : 'A');
    };

    // -------------------- ASSEGNAZIONE INDICI GLOBALI --------------------
    const assignGlobalIndexes = (allTables, allGuests) => {
        // Ordino i tavoli per ID (o per order_table) per assegnare in sequenza
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
        // Aggiorno la mappa degli indici ogni volta che cambiano tavoli o invitati assegnati
        if (tables.length > 0 && assignedGuests.length > 0) {
            const assigned_Guests = assignedGuests.filter((g) => g.id_table);
            const newMap = assignGlobalIndexes(tables, assigned_Guests);
            setGlobalIndexesMap(newMap);
        } else {
            setGlobalIndexesMap({});
        }
    }, [tables, assignedGuests]);

    // -------------------- MINI HELPERS TAVOLI --------------------
    function getGuestsByTableAndOrder(tableId, tableOrder) {
        return assignedGuests
            .filter((g) => g.id_table === tableId && g.table_order === tableOrder)
            .sort((a, b) => a.table_side_position - b.table_side_position);
    }

    // -------------------- EXPORT EXCEL & PDF --------------------
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
            // Ricarica i dati prima, se necessario
            await fetchTables();
            await fetchMapTables();
            await fetchAssignedGuests();
            await fetchUnassignedGuestsCount();

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('DisposizioneTavoli');

            // Imposta colonne
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

            // Ciclo i tavoli e i relativi invitati
            for (let t of tables) {
                const tableGuests = assignedGuests.filter((g) => g.id_table === t.id_table);

                if (tableGuests.length === 0) {
                    // Tavolo vuoto => riga "placeholder"
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

                // Altrimenti, aggiungo una riga per ogni invitato
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

            // 1) Cattura screenshot mappa
            const dataUrl = await toPng(mapRef.current, {
                scrollX: 0,
                scrollY: 0,
                canvasWidth: mapRef.current.scrollWidth * 2,
                canvasHeight: mapRef.current.scrollHeight * 2,
            });
            const imgData = dataUrl;

            // 2) Recupero info tavoli
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

            // 3) Crea PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${eventName}`, 105, 10, { align: 'center' });
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Data Evento: ${eventDate} - Piano: ${currentPlan}`, 105, 17, { align: 'center' });

            const { width: realWidth, height: realHeight } = pdf.getImageProperties(imgData);
            const scaleFactor = 190 / realWidth; // Scala immagine a 190mm di larghezza
            const finalImgHeight = realHeight * scaleFactor;

            pdf.addImage(imgData, 'PNG', 10, 30, 190, 0);

            // 4) Tabella di riepilogo
            let yPos = 125;
            const bottomOfImage = 30 + finalImgHeight + 10; // margine
            if (bottomOfImage > yPos) {
                yPos = bottomOfImage;
            }

            pdf.setFontSize(10);
            pdf.setTextColor('#000');
            pdf.setDrawColor(120, 140, 60);

            // Intestazione colonna 1
            pdf.setFillColor(200, 230, 200);
            pdf.rect(10, yPos, 90, 10, 'FD');
            pdf.text('Nome Tavolo (n. invitati)', 12, yPos + 7);

            // Intestazione colonna 2
            pdf.setFillColor(200, 230, 200);
            pdf.rect(100, yPos, 100, 10, 'FD');
            pdf.text('Varianti Menù', 102, yPos + 7);

            yPos += 10;

            tableStats.forEach((ts) => {
                // Riga tavolo
                pdf.rect(10, yPos, 90, 10);
                pdf.text(`${ts.tableName} (${ts.guestsNumber})`, 12, yPos + 7);

                // Varianti
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

            // 5) Salva PDF
            pdf.save(`Mappa_${eventName}_${eventDate}_PIANO-${currentPlan}.pdf`);
        } catch (error) {
            console.error(error);
            showAlert('Errore', 'Impossibile generare PDF');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // -------------------------------------------------------------
    //                  RENDER PRINCIPALE
    // -------------------------------------------------------------
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
                        {/* SINISTRA: INVITATI (SOLO LETTURA) */}
                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    backgroundColor: '#fff',
                                    color: '#788c3c',
                                    p: 2,
                                    borderTopLeftRadius: 6,
                                    borderTopRightRadius: 6,
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Lista Invitati</Typography>
                                    {/* Pulsante "Aggiungi Invitato" RIMOSSO */}
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    backgroundColor: '#fff',
                                    p: 2,
                                    borderBottomLeftRadius: 6,
                                    borderBottomRightRadius: 6,
                                    boxShadow: 1,
                                }}
                            >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} borderBottom={1} borderColor="#ccc" paddingBlockEnd={1}>
                                    <Typography variant="body1" fontWeight="bold">
                                        Organizza in gruppi
                                    </Typography>
                                    {/* Pulsante "Crea Gruppo" RIMOSSO */}
                            </Box>

                                <Box sx={{ maxHeight: isSmallScreen ? 300 : 600, overflowY: 'auto' }}>
                                    {/* Categorie in sola lettura */}
                                    {categories.map((cat) => (
                                        <Box
                                            key={cat.id_category}
                                            sx={{
                                                backgroundColor: '#fff',
                                                mb: 2,
                                                mr: 1,
                                                p: 1,
                                                marginBottom: 1,
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
                                                {/* Icone modifica/elimina gruppo RIMOSSE */}
                                            </Box>

                                            {/* Invitati di questo gruppo (solo lettura) */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {getGuestsByCategory(cat.id_category).map((g) => (
                                                    <Box
                                                        key={g.id_guest}
                                                        sx={{
                                                            backgroundColor: '#fff',
                                                            p: '2px 14px 0px 2px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            width: '100%',
                                                            ':hover': { backgroundColor: '#f0f0f0' },
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ fontWeight: 'bold', mr: 0.5 }}
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
                                                        {/* Icona delete invitato RIMOSSA */}
                                                        </Box>
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
                                                        p: '2px 14px 0px 2px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        width: '100%',
                                                        ':hover': { backgroundColor: '#f0f0f0' },
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ fontWeight: 'bold', mr: 0.5 }}
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
                                                    {/* Icona delete invitato RIMOSSA */}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Totale invitati */}
                                <Box mt={2} textAlign="right">
                                    <Typography variant="body2" fontWeight="bold">
                                        N. Totale invitati: {guests.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {/* DESTRA: MAPPA (SOLO VISUALIZZAZIONE) */}
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
                                        {/* Switch Piano A/B */}
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

                                        {/* Scarica Excel */}
                                        <Tooltip title="Scarica Excel Tavoli">
                                            <IconButton
                                                sx={{ color: '#788c3c' }}
                                                onClick={downloadTablesExcel}
                                                disabled={isGeneratingExcel}
                                            >
                                                <GetAppIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {/* Scarica PDF */}
                                        <Tooltip title="Scarica PDF Mappa">
                                            <IconButton
                                                sx={{ color: '#788c3c' }}
                                                onClick={downloadMapPDF}
                                                disabled={isGeneratingPDF}
                                            >
                                                <PictureAsPdfIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        {/* Pulsante "Aggiungi Tavolo" RIMOSSO */}
                                    </Box>
                                </Box>
                            </Box>
                                {/* Contenitore mappa */}
                                <Box
                                    ref={mapRef}
                                    sx={{
                                        width: '100%',
                                        minHeight: isSmallScreen ? 400 : 700,
                                        backgroundColor: '#f5f5f5',
                                        border: '1px solid #ccc',
                                        borderRadius: 2,
                                        position: 'relative',
                                    }}
                                >
                                    {/* Tavoli statici (non trascinabili) */}
                                    {mapTables.map((mt) => {
                                        const foundTable = tables.find((t) => t.id_table === mt.id_table);
                                        if (!foundTable) return null;
                                        return (
                                            <StaticMapTable
                                                key={mt.id_map_table}
                                                mapTable={mt}
                                                table={foundTable}
                                                globalIndexesMap={globalIndexesMap}
                                                assignedGuests={assignedGuests}
                                                getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                                                isSmallScreen={isSmallScreen}
                                            />
                                        );
                                    })}
                                </Box>
                        </Grid>
                    </Grid>

            </Container>

            {/* ------ ALERT ------ */}
            <AlertModal
                open={alertOpen}
                onClose={() => setAlertOpen(false)}
                title={alertTitle}
                message={alertMessage}
            />

            {/* ------ CHAT ------ */}
            <Chat />
        </DndProvider>
    );
}

export default withAuth(EventoLock);

/* ------------------------------------------------------------------
   COMPONENTE PER MOSTRARE TAVOLO (STATICO, NON TRASCINABILE)
------------------------------------------------------------------ */
function StaticMapTable({
    mapTable,
    table,
    globalIndexesMap,
    assignedGuests,
    getGuestsByTableAndOrder,
    isSmallScreen,
}) {
    // Posizione assoluta dalla tabella mappa
    const { x, y } = mapTable;

    // Dimensioni e calcoli grafici
    const dimensionWidth = isMobile ? 180 : 230;
    const dimensionHeight = isMobile ? 160 : 180;
    const containerSizeWidth = dimensionWidth;
    const containerSizeHeight = table && table.table_type === 'round' ? dimensionHeight : (isMobile ? 130 : 150);

    const scaleFactor = 0.80;

    // Funzione per renderizzare la preview del tavolo
    const renderMiniTable = () => {
        if (table.table_type === 'round') {
            return (
                <MiniRoundPreview
                    table={table}
                    getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                    globalIndexesMap={globalIndexesMap}
                    containerSizeWidth={containerSizeWidth - 10}
                    containerSizeHeight={containerSizeHeight - 8}
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
                    rotation={mapTable.rotation}
                />
            );
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: y,
                left: x,
                // Nessun cursore "move", perché non trascinabile
            }}
        >
            <div
                style={{
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top left',
                }}
            >
                <div
                    style={{
                        width: containerSizeWidth,
                        height: containerSizeHeight,
                        //backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Barra superiore con nome tavolo (niente bottoni modifica / elimina / ruota) */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            padding: '0px 6px',
                            //backgroundColor: '#788c3c',
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
                            title={table.table_name}
                        >
                            {table.table_name}
                        </div>
                    </div>

                    {/* Corpo tavolo */}
                    <div
                        style={{
                            position: 'absolute',
                            top: table.table_type === 'round' ? 0 : 16,
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
                        {renderMiniTable()}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------
   MINI PREVIEW: rotondo o rettangolare
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

    const TABLE_WIDTH = 60;
    const TABLE_HEIGHT = 80;
    const centerX = (containerSizeWidth - TABLE_WIDTH) / 2;
    const centerY = (containerSizeHeight - TABLE_HEIGHT) / 2;

    const isS = table.table_type === 's_shaped';

    // Per tavoli lunghi, posiziono i blocchi top/bottom/left/right
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

    // Mostro al massimo 2-3 invitati per lato (anteprima)
    const truncateList = (arr) => {
        if (arr.length <= 2) return arr;
        return [arr[0], { id_guest: '...', guest_name: '...' }, arr[arr.length - 1]];
    };
    const topShort = truncateList(topGuests);
    const leftShort = truncateList(leftGuests);
    const bottomShort = truncateList(bottomGuests);
    const rightShort = truncateList(rightGuests);

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
                {topShort.map((g, idx) => renderRectSeat(g, idx, globalIndexesMap, rotation))}
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
                {bottomShort.map((g, idx) => renderRectSeat(g, idx, globalIndexesMap, rotation))}
            </div>

            {/* LEFT seats */}
            {rotation === 90 ? (
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
                    {leftShort.map((g, idx) => renderRectSeat(g, idx, globalIndexesMap, rotation))}
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
                    {leftShort.map((g, idx) => renderRectSeat(g, idx, globalIndexesMap, rotation))}
                </div>
            )}

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
                {rightShort.map((g, idx) => renderRectSeat(g, idx, globalIndexesMap, rotation))}
            </div>
        </div>
    );
}

function renderRectSeat(g, idx, globalIndexesMap, rotation) {
    const truncate = (str, n = 5) => {
        if (!str) return '';
        return str.length > n ? str.substring(0, n) + '..' : str;
    };

    const content =
        g.id_guest === '...' ? '...' : (
            <>
                {globalIndexesMap[g.id_guest] && (
                    <span style={{ fontWeight: 'bold' }}>{globalIndexesMap[g.id_guest]}</span>
                )}
                {' - '}
                {truncate(g.guest_name)}
            </>
        );

    if (rotation === 90) {
        // Poltroncina verticale
        return (
            <div
                key={g.id_guest + '-' + idx}
                style={{
                    width: '20px',
                    height: '60px',
                    border: '1px solid #999',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
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
                    }}
                >
                    {content}
                </div>
            </div>
        );
    } else {
        // Poltroncina orizzontale
        return (
            <div
                key={g.id_guest + '-' + idx}
                style={{
                    width: '60px',
                    height: '20px',
                    border: '1px solid #999',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
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
    // Più o meno 12 posizioni intorno al tavolo
    const angleStep = (2 * Math.PI) / 12;

    return (
        <div
            style={{
                width: containerSizeWidth,
                height: containerSizeHeight,
                position: 'relative',
            }}
        >
            {/* Tavolo rotondo */}
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

            {/* Invitati intorno (max 12 in preview) */}
            {roundGuests.slice(0, 12).map((g, idx) => {
                // Uso la posizione su table_side_position come indice per l'angolo
                const angle = (g.table_side_position - 1) * angleStep - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return renderRoundSeat(g, idx, globalIndexesMap, x, y);
            })}
        </div>
    );
}

function renderRoundSeat(g, idx, globalIndexesMap, x, y) {
    const truncate = (str, n = 7) => {
        if (!str) return '';
        return str.length > n ? str.substring(0, n) + '...' : str;
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
            }}
            title={g.guest_name}
        >
            {globalIndex && (
                <span style={{ fontWeight: 'bold' }}>{globalIndex}</span>
            )}
            {' - '}
            {truncate(g.guest_name)}
        </div>
    );
}
