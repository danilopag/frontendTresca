// pages/_app.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
import * as React from 'react';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyles } from '@mui/material';
import '@fontsource/vollkorn';
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
    fontFamily: 'Vollkorn, serif', 
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
        <GlobalStyles
          styles={{
            '::-webkit-scrollbar': {
              width: '10px',
            },
            '::-webkit-scrollbar-track': {
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
            },
            '::-webkit-scrollbar-thumb': {
              backgroundColor: '#999',
              borderRadius: '4px',
              border: '1px solid #ccc',
            },
            '::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#555',
            },
          }}
        />
        <Component {...pageProps} />
      </ThemeProvider>
    </React.Fragment>
  );
}
