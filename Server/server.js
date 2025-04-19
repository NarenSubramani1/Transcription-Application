const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");

const dotenv = require("dotenv");
dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Deepgram API Key Configuration
const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);

const setupDeepgram = (socket) => {
  const deepgram = deepgramClient.listen.live({
    language: "en",
    punctuate: true,
    smart_format: true,
    model: "nova",
  });

// Deepgram Listeners
  deepgram.addListener(LiveTranscriptionEvents.Open, () => {
    // deepgram: connected
    deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
    // deepgram: transcript received
      socket.emit("transcript", data);
    });

    deepgram.addListener(LiveTranscriptionEvents.Close, () => {
      // deepgram: disconnected
      deepgram.finalize();
    });

    deepgram.addListener(LiveTranscriptionEvents.Error, (error) => {
      console.error("deepgram: error", error);
    });

    deepgram.addListener(LiveTranscriptionEvents.Warning, (warning) => {
      console.warn("deepgram: warning", warning);
    });
  });
  return deepgram;
};

// Socket Establishment
io.on("connection", (socket) => {
  // socket.io: client connection
  let deepgram = setupDeepgram(socket);
  socket.on("audio", (audioData) => {
    // socket.io: audio data receiver
    deepgram.send(audioData);
  });

  socket.on("disconnect", () => {
    // socket.io: client disconnection
    if (deepgram) {
      deepgram.finalize({ reason: 'Session ended' });
      deepgram.removeAllListeners();
    }
    deepgram = null;
  });
});

server.listen(5000, () => {
  console.log("Server is listening on port 5000");
});
