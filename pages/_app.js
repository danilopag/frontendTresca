// pages/_app.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import * as React from 'react';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '@fontsource/playfair-display';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css'

const theme = createTheme({
  palette: {
    primary: {
      main: '#788c3c', // Colore primario personalizzato
    },
    secondary: {
      main: '#657a33', // Colore secondario personalizzato
    },
  },
  typography: {
    fontFamily: 'Playfair Display', 
  },
});

export default function MyApp({ Component, pageProps }) {
  return (
    <React.Fragment>
      <Head>
        <title>Tenuta Tresca - Gestionale </title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </React.Fragment>
  );
}
