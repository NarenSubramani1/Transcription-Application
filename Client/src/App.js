import React, { useState, useEffect, useRef,useMemo } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Switch,
  AppBar,
  Toolbar,
  Box,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import { Mic, MicOff, DarkMode, LightMode } from '@mui/icons-material';
import socket from "./socket"; //

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("Captions by Deepgram");
  const [darkMode, setDarkMode] = useState(false);
  const mediaRecorderRef = useRef(null);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: darkMode ? '#90caf9' : '#1976d2',
          },
        },
      }),
    [darkMode]
  );

  useEffect(() => {
    // Transcription receiver end
    socket.on("transcript", (data) => {
      if (data.channel?.alternatives[0]?.transcript) {
        setTranscript(data.channel.alternatives[0].transcript);
      }
    });
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          socket.emit('audio', event.data);
        }
      });
      // Send chunks of audio in 500ms
      mediaRecorderRef.current.start(500); 
      setIsRecording(true);
    } catch (err) {
      alert('Please allow microphone access.');
    }
  };

const stopRecording = () => {
  if (mediaRecorderRef.current) {
    // Stop the recording
    mediaRecorderRef.current.stop();

    // Stop all media tracks
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

    // Clear mediaRecorder
    mediaRecorderRef.current = null;
  }
  setIsRecording(false);
};

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">🎙️ Live Transcription</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LightMode />
            <Switch checked={darkMode} onChange={() => setDarkMode((prev) => !prev)} />
            <DarkMode />
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <TextField
          label="Transcript"
          multiline
          fullWidth
          minRows={8}
          value={transcript}
          InputProps={{ readOnly: true }}
          variant="outlined"
          sx={{ mb: 3 }}
        />

        
        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
          <Button
            variant={isRecording ? 'contained' : 'outlined'}
            color={isRecording ? 'error' : 'primary'}
            startIcon={isRecording ? <MicOff /> : <Mic />}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? 'Stop Mic' : 'Start Mic'}
          </Button>

          <Chip
            label={isRecording ? 'Mic On' : 'Mic Off'}
            color={isRecording ? 'success' : 'default'}
            sx={{ fontWeight: 'bold' }}
          />
        </Stack>

        <Box mt={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Your speech is transcribed in real-time using Deepgram.
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
