import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket'], // force WebSocket (avoid polling fallback)
});

export default socket;
