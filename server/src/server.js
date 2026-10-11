import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/socketHandler.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];

    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true
      }
    });

    initSocket(io);

    server.listen(PORT, () => {
      console.log(`[Server] TaskFlow Pro API server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`[Server] Health check available at http://localhost:${PORT}/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      console.log('[Server] Received termination signal. Closing gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err) {
    console.error('[Server Error] Server failed to start:', err);
    process.exit(1);
  }
};

startServer();
