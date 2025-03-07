// pages/index.js
/*
 * Copyright (c) 2025, Danilo Paglialunga.
 * Tutti i diritti riservati.
 */
 
import { useState } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/router';
import {
  Container,
  Box,
  TextField,
  Button,
  InputAdornment,
  Card,
  CardContent,
  useMediaQuery,
} from '@mui/material';
import AlertModal from '../components/AlertModal';
import { styled, useTheme } from '@mui/material/styles';
import { Email, Lock } from '@mui/icons-material';
import withAuth from '../components/withAuth';
import '@fontsource/playfair-display';

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

const FormContainer = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 400,
  margin: 'auto',
  marginTop: theme.spacing(4),
  border: '1px solid #788c3c', // Bordo verde simile alla dashboard
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
}));

const MainPage = () => {
  // Stato per i campi di login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // Stato per l'alert
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      if (res.data.user.is_admin) {
        router.push('/admin/dashboard');
      } else if (res.data.lockEdit) {
        router.push('/eventoLock');
      } else {
        router.push('/evento');
      }
    } catch (error) {
      showAlert('Errore', error.response?.data?.message || 'Errore durante il login');
    }
  };

  return (
    <>
      <Background />
      <Overlay />
      <Container maxWidth="md">
        <FormContainer elevation={10}>
          <CardContent>
            <Box textAlign="center" mb={2}>
              <img
                src="/logoTrescaPng.PNG"
                alt="Logo Tresca"
                style={{
                  width: '100%',
                  maxWidth: isMobile ? '200px' : '250px',
                  margin: '0 auto',
                  display: 'block',
                }}
              />
            </Box>

            <Box component="form" onSubmit={handleLoginSubmit} mt={2}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  autoComplete: 'current-password', // Aggiungi questa linea
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  backgroundColor: '#788c3c',
                  color: 'white',
                  ':hover': {
                    backgroundColor: '#657a33',
                  },
                }}
              >
                Accedi
              </Button>
            </Box>

            {/* AlertModal per gli errori */}
            <AlertModal
              open={alertOpen}
              onClose={() => setAlertOpen(false)}
              title={alertTitle}
              message={alertMessage}
            />
          </CardContent>
        </FormContainer>
      </Container>
    </>
  );
};

export default withAuth(MainPage);
