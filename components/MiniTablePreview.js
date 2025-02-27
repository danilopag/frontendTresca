// MiniTablePreview.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import React from 'react';

/**
 * MiniTablePreview (dimensione ~200x200):
 * - Disegna un box 200×200.
 * - Al centro mette la forma del tavolo (rettangolo / S / tondo).
 * - Attorno (o radialmente) piazza i “seggiolini” in miniatura con i nomi invitati.
 * - Se i posti sono troppi, mostra i primi e gli ultimi, inserendo "...".
 */
function MiniTablePreview({
    table,                 // { table_type, id_table, ... }
    assignedGuests,        // array invitati con { id_table, table_order, table_side_position, guest_name, ... }
    getGuestsByTableAndOrder,
    globalIndexesMap,
}) {
    if (!table) return null;

    const shape = table.table_type;
    // Scegliamo se disegnare un “miniRectPreview” o “miniRoundPreview” o “miniSPreview”
    if (shape === 'round') {
        return (
            <div
                style={{
                    width: '200px',
                    height: '200px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <MiniRoundTable
                    table={table}
                    assignedGuests={assignedGuests}
                    getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                    globalIndexesMap={globalIndexesMap}
                />
            </div>
        );
    } else {
        // rectangular o s_shaped, li tratto allo stesso modo (cambia solo l’immagine)
        return (
            <div
                style={{
                    width: '200px',
                    height: '200px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <MiniRectTable
                    table={table}
                    assignedGuests={assignedGuests}
                    getGuestsByTableAndOrder={getGuestsByTableAndOrder}
                    globalIndexesMap={globalIndexesMap}
                />
            </div>
        );
    }
}

/* ------------------------------------------------------------------
    MINI TAVOLO ROTONDO
------------------------------------------------------------------ */
function MiniRoundTable({
    table,
    assignedGuests,
    getGuestsByTableAndOrder,
    globalIndexesMap,
}) {
    // recuperiamo i guests con table_order=0 (o come usi per i round)
    const roundGuests = getGuestsByTableAndOrder(table.id_table, 0);

    // dimensione del contenitore
    const size = 200;

    // disegniamo un “cerchio” al centro (svg o un div rotondo) e i seat attorno
    const circleDiameter = 80; // dimensione del cerchio centrale

    // funzione che riduce il numero di invitati se ce ne sono troppi
    function shortList(arr) {
        // se vuoi mostrare tutti, puoi rimuovere. Oppure:
        if (arr.length <= 8) return arr; // max 8
        // mostriamo i primi 3 e gli ultimi 2
        return [...arr.slice(0, 3), { id_guest: '...', guest_name: '...' }, ...arr.slice(-2)];
    }

    const shortGuests = shortList(roundGuests);

    // per disporli radialmente, calcoliamo un raggio e un offset
    const radius = 70; // in pixel
    const center = size / 2; // 100
    const angleStep = (2 * Math.PI) / shortGuests.length;

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Cerchio al centro (tavolo) */}
            <div
                style={{
                    position: 'absolute',
                    top: center - circleDiameter / 2,
                    left: center - circleDiameter / 2,
                    width: circleDiameter,
                    height: circleDiameter,
                    backgroundColor: '#ddd',
                    borderRadius: '50%',
                }}
            >
                {/* Se vuoi un’immagine custom, puoi mettere un <img> o un <svg> */}
            </div>

            {/* Invitati (mini seat) in posizione radiale */}
            {shortGuests.map((guest, idx) => {
                if (guest.id_guest === '...') {
                    // puntini
                    const angle = idx * angleStep;
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);
                    return (
                        <div
                            key={`dots-${idx}`}
                            style={{
                                position: 'absolute',
                                top: y,
                                left: x,
                                transform: 'translate(-50%, -50%)',
                                fontSize: '10px',
                                backgroundColor: 'white',
                                border: '1px solid #aaa',
                                borderRadius: '4px',
                                padding: '2px 4px',
                            }}
                        >
                            ...
                        </div>
                    );
                }
                // invitato vero
                const angle = idx * angleStep;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                const globalIndex = globalIndexesMap[guest.id_guest];
                return (
                    <div
                        key={guest.id_guest}
                        style={{
                            position: 'absolute',
                            top: y,
                            left: x,
                            transform: 'translate(-50%, -50%)',
                            fontSize: '9px',
                            backgroundColor: 'white',
                            border: '1px solid #aaa',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            maxWidth: '80px',
                            textAlign: 'center',
                        }}
                    >
                        {guest.guest_name}
                        {globalIndex ? `(#${globalIndex})` : ''}
                    </div>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------
    MINI TAVOLO RETTANGOLARE O A S
------------------------------------------------------------------ */
function MiniRectTable({
    table,
    assignedGuests,
    getGuestsByTableAndOrder,
    globalIndexesMap,
}) {
    // prendo i 4 lati
    const topGuests = getGuestsByTableAndOrder(table.id_table, 1);
    const leftGuests = getGuestsByTableAndOrder(table.id_table, 2);
    const bottomGuests = getGuestsByTableAndOrder(table.id_table, 3);
    const rightGuests = getGuestsByTableAndOrder(table.id_table, 4);

    // se troppi invitati su un lato, riduciamo a primo, "..." e ultimo
    function shortList(arr) {
        if (arr.length <= 3) return arr;
        return [arr[0], { id_guest: '...', guest_name: '...' }, arr[arr.length - 1]];
    }

    const topShort = shortList(topGuests);
    const leftShort = shortList(leftGuests);
    const bottomShort = shortList(bottomGuests);
    const rightShort = shortList(rightGuests);

    const size = 200; // box esterno
    // mettiamo il tavolo al centro. Se shape = "s_shaped", disegno un <img> con la S
    // Se shape = "rectangular", disegno un box.
    // dimensione di quell’elemento
    const tableWidth = 100;
    const tableHeight = 80;

    // coordinate per centrarlo
    const centerX = (size - tableWidth) / 2; // 50
    const centerY = (size - tableHeight) / 2; // 60

    // Decidiamo come disegnare la “forma” al centro
    const isS = table.table_type === 's_shaped';

    return (
        <div style={{ width: size, height: size, position: 'relative' }}>
            {/* Tavolo al centro */}
            {isS ? (
                <img
                    src="/S.svg"
                    alt="Tavolo a S"
                    style={{
                        position: 'absolute',
                        top: centerY,
                        left: centerX,
                        width: tableWidth,
                        height: tableHeight,
                        objectFit: 'fill',
                    }}
                />
            ) : (
                // rettangolo
                <div
                    style={{
                        position: 'absolute',
                        top: centerY,
                        left: centerX,
                        width: tableWidth,
                        height: tableHeight,
                        backgroundColor: '#ddd',
                    }}
                />
            )}

            {/* Invitati TOP (mini seat) */}
            <div
                style={{
                    position: 'absolute',
                    top: centerY - 25, // 25 px sopra il tavolo
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '4px',
                }}
            >
                {topShort.map((g, idx) => renderGuestBox(g, idx, globalIndexesMap))}
            </div>

            {/* Invitati BOTTOM */}
            <div
                style={{
                    position: 'absolute',
                    top: centerY + tableHeight + 5,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '4px',
                }}
            >
                {bottomShort.map((g, idx) => renderGuestBox(g, idx, globalIndexesMap))}
            </div>

            {/* Invitati LEFT (li mettiamo in colonna) */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: centerX - 5 - 80,
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                {leftShort.map((g, idx) => renderGuestBox(g, idx, globalIndexesMap))}
            </div>

            {/* Invitati RIGHT */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: centerX + tableWidth + 5,
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                {rightShort.map((g, idx) => renderGuestBox(g, idx, globalIndexesMap))}
            </div>
        </div>
    );
}

/**
 * renderGuestBox: helper che mostra un mini box con il nome dell’invitato
 */
function renderGuestBox(g, idx, globalIndexesMap) {
    if (g.id_guest === '...') {
        return (
            <div
                key={`dots-${idx}`}
                style={{
                    fontSize: '10px',
                    backgroundColor: 'white',
                    border: '1px solid #aaa',
                    borderRadius: '4px',
                    padding: '2px 4px',
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
                fontSize: '9px',
                backgroundColor: 'white',
                border: '1px solid #aaa',
                borderRadius: '4px',
                padding: '2px 4px',
                maxWidth: '80px',
                textAlign: 'center',
            }}
        >
            {g.guest_name}
            {globalIndex ? ` (#${globalIndex})` : ''}
        </div>
    );
}

export default MiniTablePreview;
