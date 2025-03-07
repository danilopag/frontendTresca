// pages/admin/MapPreview.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { styled, useTheme } from '@mui/material/styles';
import {
    Container,
    Box,
    Typography,
    Button,
    IconButton,
    Tooltip,
    FormControlLabel,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
} from '@mui/material';
import {
    PictureAsPdf as PictureAsPdfIcon,
    GetApp as GetAppIcon,
} from '@mui/icons-material';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';

import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

import withAuth from '../../components/withAuth';
import AlertModal from '../../components/AlertModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import TableCard from '../../components/TableCard';
import api from '../../utils/api';

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

const MapWrapper = styled('div')(({ theme }) => ({
    width: '100%',
    minHeight: 600,
    backgroundColor: '#f9f9f9',
    border: '1px solid #ccc',
    borderRadius: 6,
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
        minHeight: 400,
    },
}));

function MapPreview() {
    const router = useRouter();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const dndBackend = isMobile ? TouchBackend : HTML5Backend;

    const [userId, setUserId] = useState(null);
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [currentPlan, setCurrentPlan] = useState('A');

    const [tables, setTables] = useState([]);
    const [mapTables, setMapTables] = useState([]);
    const [assignedGuests, setAssignedGuests] = useState([]);

    const [globalIndexesMap, setGlobalIndexesMap] = useState({});

    const [tableCardOpen, setTableCardOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(() => { });

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

    const mapRef = useRef(null);

    useEffect(() => {
        if (!router.isReady) return;
        const { id_user } = router.query;
        if (!id_user) {
            router.push('/admin/dashboard');
            return;
        }
        setUserId(id_user);
        fetchUserEvent(id_user);
        fetchAllData(id_user, currentPlan);
    }, [router.isReady, currentPlan]);

    const showAlert = (title, msg) => {
        setAlertTitle(title);
        setAlertMessage(msg);
        setAlertOpen(true);
    };

    const handlePlanSwitch = (e) => {
        setCurrentPlan(e.target.checked ? 'B' : 'A');
    };

    const fetchUserEvent = async (uId) => {
        try {
            const res = await api.get(`/users/${uId}`);
            if (res.data) {
                setEventName(res.data.event_name || '');
                if (res.data.event_date) {
                    const d = new Date(res.data.event_date);
                    setEventDate(d.toLocaleDateString('it-IT'));
                }
            }
        } catch (error) {
            console.error('fetchUserEvent error:', error);
        }
    };

    const fetchAllData = async (uId, plan) => {
        try {
            await Promise.all([
                fetchTables(uId, plan),
                fetchMapTables(uId, plan),
                fetchAssignedGuests(uId, plan),
            ]);
            computeGlobalIndexes();
        } catch (error) {
            showAlert('Errore', 'Impossibile caricare i dati mappa');
        }
    };

    const fetchTables = async (uId, plan) => {
        const res = await api.get('/admin/tables', { params: { id_user: uId, plan } });
        setTables(res.data);
    };

    const fetchMapTables = async (uId, plan) => {
        const res = await api.get('/admin/map_tables', { params: { id_user: uId, plan } });
        setMapTables(res.data);
    };

    const fetchAssignedGuests = async (uId, plan) => {
        const res = await api.get('/admin/guests/assigned', { params: { id_user: uId, plan } });
        setAssignedGuests(res.data);
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

    const computeGlobalIndexes = () => {
        if (!tables.length || !assignedGuests.length) {
            //console.log('computeGlobalIndexes: no tables or guests');
            setGlobalIndexesMap({});
            return;
        }
        const assignedWithTable = assignedGuests.filter((g) => g.id_table);
        const map = assignGlobalIndexes(tables, assignedWithTable);
        setGlobalIndexesMap(map);
    };

    function assignGlobalIndexes(allTables, allGuests) {
        // Ordina i tavoli per ID
        const sortedTables = [...allTables].sort((a, b) => a.id_table - b.id_table);
        let globalCounter = 1;
        const result = {};

        for (const t of sortedTables) {
            const guestsForTable = allGuests.filter((g) => g.id_table === t.id_table);
            let ordered = [];
            if (t.table_type === 'round') {
                ordered = guestsForTable.sort((a, b) => a.table_side_position - b.table_side_position);
            } else {
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
                ordered = [...top, ...left, ...right, ...bottom];
            }
            for (const guest of ordered) {
                result[guest.id_guest] = globalCounter;
                globalCounter++;
            }
        }
        return result;
    }

    const openTableCard = (tableId) => {
        const found = tables.find((t) => t.id_table === tableId);
        if (!found) return;
        setSelectedTable(found);
        setTableCardOpen(true);
    };
    const closeTableCard = () => {
        setSelectedTable(null);
        setTableCardOpen(false);
    };

    const getGuestsByTableAndOrder = (tableId, order) => {
        return assignedGuests
            .filter((g) => g.id_table === tableId && g.table_order === order)
            .sort((a, b) => a.table_side_position - b.table_side_position);
    };

    const handleDeleteTable = (tableId) => {
        setConfirmAction(() => async () => {
            try {
                await api.delete(`/admin/tables/${tableId}`);
                await fetchAllData(userId, currentPlan);
                closeTableCard();
            } catch (error) {
                showAlert('Errore', 'Impossibile eliminare tavolo');
            }
        });
        setConfirmOpen(true);
    };

    function mapIntolerance(value) {
        const dict = {
            baby: 'Bambino',
            vegetarian: 'Vegetariano',
            vegan: 'Vegano',
            gluten_free: 'Senza Glutine',
            pregnant: 'Incinta',
            lactose_free: 'Senza Lattosio',
            other: 'Altro',
        };
        return dict[value] || value;
    }
    function mapTableOrder(value) {
        const m = {
            0: '-',
            1: 'Capotavola Alto',
            2: 'Lato Lungo Destro',
            3: 'Capotavola Basso',
            4: 'Lato Lungo Sinistro',
        };
        return m[value] || '-';
    }
    function mapTableType(value) {
        if (value === 'round') return 'Tavolo Tondo';
        if (value === 's_shaped') return 'Tavolo a S';
        return 'Tavolo Rettangolare';
    }

    const downloadTablesExcel = async () => {
        setIsGeneratingExcel(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Tavoli');

            sheet.columns = [
                { header: 'N. Invitato', key: 'global_index', width: 10 },
                { header: 'Nome Tavolo', key: 'table_name', width: 20 },
                { header: 'Tipo', key: 'table_type', width: 15 },
                { header: 'Lato', key: 'table_side', width: 30 },
                { header: 'Pos.', key: 'pos', width: 10 },
                { header: 'Nome Invitato', key: 'guest_name', width: 22 },
                { header: 'Intolleranze', key: 'intols', width: 32 },
                { header: 'Note', key: 'other_text', width: 20 },
            ];

            for (const t of tables) {
                const gAssigned = assignedGuests.filter((g) => g.id_table === t.id_table);
                if (!gAssigned.length) {
                    sheet.addRow({
                        global_index: '',
                        table_name: t.table_name,
                        table_type: mapTableType(t.table_type),
                        table_side: '-',
                        pos: '-',
                        guest_name: 'NESSUN INVITATO',
                        intols: '',
                        other_text: '',
                    });
                    continue;
                }
                for (const g of gAssigned) {
                    const globalIdx = globalIndexesMap[g.id_guest] || '-';
                    const intols = (g.intolerances || []).map(mapIntolerance).join(', ');
                    sheet.addRow({
                        global_index: globalIdx,
                        table_name: t.table_name,
                        table_type: mapTableType(t.table_type),
                        table_side: mapTableOrder(g.table_order),
                        pos: g.table_side_position != null ? g.table_side_position : '',
                        guest_name: g.guest_name,
                        intols,
                        other_text: g.other_text || '',
                    });
                }
            }

            sheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Tavoli_${eventName}_Piano-${currentPlan}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            showAlert('Errore', 'Impossibile generare Excel');
        }
        setIsGeneratingExcel(false);
    };

    const downloadMapPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            if (!mapRef.current) return;
            const dataUrl = await toPng(mapRef.current);

            const tableStats = [];
            for (const t of tables) {
                const gAssigned = assignedGuests.filter((gg) => gg.id_table === t.id_table);
                let variantsCount = {};
                gAssigned.forEach((gg) => {
                    if (gg.intolerances) {
                        gg.intolerances.forEach((v) => {
                            if (!variantsCount[v]) variantsCount[v] = 0;
                            variantsCount[v]++;
                        });
                    }
                });
                tableStats.push({
                    tableName: t.table_name,
                    guestsNumber: gAssigned.length,
                    variants: variantsCount,
                });
            }

            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.text(eventName || 'EVENTO', 105, 10, { align: 'center' });
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Data: ${eventDate} - Piano: ${currentPlan}`, 105, 17, { align: 'center' });

            const { width: realW, height: realH } = pdf.getImageProperties(dataUrl);
            const scaleFactor = 190 / realW;
            const finalH = realH * scaleFactor;
            pdf.addImage(dataUrl, 'PNG', 10, 25, 190, 0);

            let yPos = 25 + finalH + 10;
            if (yPos < 60) yPos = 60;
            pdf.setFontSize(10);
            pdf.setDrawColor(120, 140, 60);
            pdf.setFillColor(200, 230, 200);
            pdf.rect(10, yPos, 90, 10, 'FD');
            pdf.text('Nome Tavolo (n. invitati)', 12, yPos + 7);

            // Intestazione colonna 2
            pdf.setFillColor(200, 230, 200);
            pdf.rect(100, yPos, 100, 10, 'FD');
            pdf.text('Varianti Menù', 102, yPos + 7);

            yPos += 10;
            for (const ts of tableStats) {
                pdf.rect(10, yPos, 90, 10);
                pdf.text(`${ts.tableName} (${ts.guestsNumber})`, 12, yPos + 7);

                const variantsArr = [];
                Object.entries(ts.variants).forEach(([k, c]) => {
                    variantsArr.push(`${mapIntolerance(k)}(${c})`);
                });
                const vString = variantsArr.join(', ') || '-';

                pdf.rect(100, yPos, 100, 10);
                pdf.text(vString, 102, yPos + 7);

                yPos += 10;
                if (yPos > 280) {
                    pdf.addPage();
                    yPos = 10;
                }
            }
            pdf.save(`Mappa_${eventName}_Piano-${currentPlan}.pdf`);
        } catch (err) {
            showAlert('Errore', 'Impossibile generare PDF');
        }
        setIsGeneratingPDF(false);
    };

    return (
        <DndProvider backend={dndBackend}>
            <Container maxWidth="xl">
                    <Box
                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, paddingTop: 2 }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#788c3c' }}>
                            {eventName || 'NOME EVENTO'}
                        </Typography>
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={currentPlan === 'B'}
                                        onChange={handlePlanSwitch}
                                        color="primary"
                                    />
                                }
                                label="Piano A / B"
                            />
                            <Tooltip title="Scarica Excel Tavoli">
                                <IconButton
                                    sx={{ ml: 1, backgroundColor: '#788c3c', color: 'white' }}
                                    onClick={downloadTablesExcel}
                                    disabled={isGeneratingExcel}
                                >
                                    <GetAppIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Scarica PDF Mappa">
                                <IconButton
                                    sx={{ ml: 1, backgroundColor: '#788c3c', color: 'white' }}
                                    onClick={downloadMapPDF}
                                    disabled={isGeneratingPDF}
                                >
                                    <PictureAsPdfIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <MapWrapper ref={mapRef}>
                        {mapTables.map((mt) => {
                            const found = tables.find((t) => t.id_table === mt.id_table);
                            if (!found) return null;
                            return (
                                <FixedMapTable
                                    key={mt.id_map_table}
                                    mapTable={mt}
                                    tableInfo={found}
                                    onClickTable={() => openTableCard(found.id_table)}
                                    assignedGuests={assignedGuests}
                                    getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                                    globalIndexesMap={globalIndexesMap}
                                />
                            );
                        })}
                    </MapWrapper>

                    <Box mt={4} textAlign="center">
                        <Button
                            variant="contained"
                            onClick={() => router.push('/admin/dashboard')}
                            sx={{
                                backgroundColor: '#788c3c',
                                color: 'white',
                                ':hover': { backgroundColor: '#657a33' },
                            }}
                        >
                            Torna Indietro
                        </Button>
                    </Box>
            </Container>

            <Dialog
                open={tableCardOpen && selectedTable !== null}
                onClose={closeTableCard}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Dettagli Tavolo</DialogTitle>
                <DialogContent dividers>
                    {selectedTable && (
                        <TableCard
                            table={selectedTable}
                            guests={assignedGuests}
                            getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                            globalIndexesMap={globalIndexesMap}
                            currentPlan={currentPlan}
                            readOnly
                            handleDeleteClick={handleDeleteTable}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeTableCard}>Chiudi</Button>
                </DialogActions>
            </Dialog>

            <AlertModal
                open={alertOpen}
                onClose={() => setAlertOpen(false)}
                title={alertTitle}
                message={alertMessage}
            />

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
        </DndProvider>
    );
}

/* ------------------------------------------------------------------
   TAVOLO FISSO - Rende il tavolo in stile "StaticMapTable"
   ma SENZA modificare la logica (clic, dimensioni, etc.)
------------------------------------------------------------------ */
function FixedMapTable({
    mapTable,
    tableInfo,
    onClickTable,
    assignedGuests,
    getGuestsByTableAndOrder,
    globalIndexesMap,
}) {
    const { x, y, rotation } = mapTable;

    // Esempio di dimensioni e fattore scala (simile a StaticMapTable)
    const scaleFactor = 0.8;
    const dimensionWidth = isMobile ? 180 : 230;
    const dimensionHeight = isMobile ? 160 : 180;
    const containerSizeWidth = dimensionWidth;
    const containerSizeHeight = tableInfo && tableInfo.table_type === 'round' ? dimensionHeight : (isMobile ? 130 : 150);
    

    return (
        <div
            style={{
                position: 'absolute',
                top: y,
                left: x,
            }}
        >
            {/* Usando la stessa struttura "scale()" per avvicinarci allo stile StaticMapTable */}
            <div
                style={{
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top left',
                }}
            >
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
                    {/* Barra superiore con il nome del tavolo, stile "light" */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0px 6px',
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
                            title={tableInfo.table_name}
                        >
                            {tableInfo.table_name}
                        </div>
                    </div>

                    {/* Corpo tavolo, ruotato in base a mapTable.rotation, e con onClick */}
                    <div
                        onClick={onClickTable}
                        style={{
                            position: 'absolute',
                            top: tableInfo?.table_type === 'round' ? 0 : 16,
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
                        <MiniTablePreview
                            table={tableInfo}
                            assignedGuests={assignedGuests}
                            getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                            globalIndexesMap={globalIndexesMap}
                            containerSizeWidth={containerSizeWidth - 10}
                            containerSizeHeight={containerSizeHeight - 8}
                            rotation={mapTable.rotation}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------
   MINI PREVIEW (Rect / Round) STESSO STILE DI "StaticMapTable"
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

/* ----------------- Mini Rect style (ripreso da StaticMapTable) --------------- */
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

    let topOffset = centerY - 25;
    let bottomOffset = centerY + TABLE_HEIGHT + 5;
    let horizontalGap = '4px';
    let verticalGap = '4px';

    const isS = table.table_type === 's_shaped';

    // Mostro al massimo 2-3 invitati per lato come anteprima
    const truncateList = (arr) => {
        if (arr.length <= 2) return arr;
        return [arr[0], { id_guest: '...', guest_name: '...' }, arr[arr.length - 1]];
    };
    const topShort = truncateList(topGuests);
    const leftShort = truncateList(leftGuests);
    const bottomShort = truncateList(bottomGuests);
    const rightShort = truncateList(rightGuests);

    if (rotation === 90) {
        topOffset = centerY - 60;
        bottomOffset = centerY + TABLE_HEIGHT;
        horizontalGap = '8px';
        verticalGap = '1px';
    }

    return (
        <div style={{
            position: 'relative',
            width: containerSizeWidth,
            height: containerSizeHeight,
        }}>
            {/* Tavolo */}
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
                {rightShort.map((g, idx) => renderRectSeat(g, idx, globalIndexesMap, rotation))}
            </div>
        </div>
    );
}

// Stessa resa poltroncine orizzontali, semplificata
function renderRectSeat(g, idx, globalIndexesMap, rotation) {
    const truncate = (str, n = 5) => {
        if (!str) return '';
        return str.length > n ? str.substring(0, n) + '..' : str;
    };
    const content = (g.id_guest === '...')
        ? '...'
        : (
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
    } else {
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

/* ----------------- Mini Round style (ripreso da StaticMapTable) --------------- */
function MiniRoundPreview({
    table,
    getGuestsByTableAndOrder,
    globalIndexesMap,
}) {
    const roundGuests = getGuestsByTableAndOrder(table.id_table, 0);
    const containerSize = 100;
    const center = containerSize / 2;
    const TABLE_DIAM = 60;
    const radius = 70; // cerchio un po' più ampio di 60

    return (
        <div
            style={{
                position: 'relative',
                width: containerSize,
                height: containerSize,
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
                // calcolo dell'angolo (compatibile con l'idea di table_side_position)
                const angleStep = (2 * Math.PI) / 12;
                // Se i guest hanno table_side_position da 1 a 12
                // altrimenti ci adattiamo
                const angle = ((g.table_side_position || (idx + 1)) - 1) * angleStep - Math.PI / 2;
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

    const content = (g.id_guest === '...')
        ? '...'
        : (
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

    return (
        <div
            key={g.id_guest + '-' + idx}
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
            {content}
        </div>
    );
}

export default withAuth(MapPreview);
