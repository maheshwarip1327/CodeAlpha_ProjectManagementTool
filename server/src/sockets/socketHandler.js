import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';

let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1] ||
        socket.handshake.headers?.cookie
          ?.split(';')
          ?.find((c) => c.trim().startsWith('token='))
          ?.split('=')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('_id name email systemRole status');
      if (!user || user.status === 'suspended') {
        return next(new Error('User unauthorized or suspended'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join personal user room for direct notifications
    socket.join(`user:${socket.user._id}`);

    // Join workspace room
    socket.on('join:workspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
      }
    });

    socket.on('leave:workspace', (workspaceId) => {
      if (workspaceId) {
        socket.leave(`workspace:${workspaceId}`);
      }
    });

    // Join project room
    socket.on('join:project', (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on('leave:project', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
};

export const getIO = () => ioInstance;

export const emitToWorkspace = (workspaceId, event, data) => {
  if (ioInstance && workspaceId) {
    ioInstance.to(`workspace:${workspaceId}`).emit(event, data);
  }
};

export const emitToProject = (projectId, event, data) => {
  if (ioInstance && projectId) {
    ioInstance.to(`project:${projectId}`).emit(event, data);
  }
};

export const emitToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
};
