import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../lib/api';
import { User, Workspace } from '../types';

interface AuthContextType {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; title?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  socket: Socket | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const setCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspaceState(workspace);
    localStorage.setItem('taskflow_current_ws', workspace._id);
  };

  const fetchSession = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setWorkspaces(res.data.workspaces || []);

        const savedWsId = localStorage.getItem('taskflow_current_ws');
        const matched = (res.data.workspaces || []).find((w: Workspace) => w._id === savedWsId);
        setCurrentWorkspaceState(matched || res.data.workspaces[0] || null);
      }
    } catch {
      setUser(null);
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user) {
      const s = io('/', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      s.on('connect', () => {
        if (currentWorkspace) {
          s.emit('join:workspace', currentWorkspace._id);
        }
      });

      setSocket(s);

      return () => {
        s.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user?._id]);

  // Join workspace room when current workspace changes
  useEffect(() => {
    if (socket && currentWorkspace) {
      socket.emit('join:workspace', currentWorkspace._id);
      return () => {
        socket.emit('leave:workspace', currentWorkspace._id);
      };
    }
  }, [socket, currentWorkspace?._id]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data.success) {
      localStorage.setItem('taskflow_token', res.data.token);
      setUser(res.data.user);
      setWorkspaces(res.data.workspaces || []);
      if (res.data.workspaces?.length > 0) {
        setCurrentWorkspace(res.data.workspaces[0]);
      }
    }
  };

  const register = async (data: { name: string; email: string; password: string; title?: string }) => {
    const res = await api.post('/auth/register', data);
    if (res.data.success) {
      localStorage.setItem('taskflow_token', res.data.token);
      setUser(res.data.user);
      if (res.data.defaultWorkspace) {
        setWorkspaces([res.data.defaultWorkspace]);
        setCurrentWorkspace(res.data.defaultWorkspace);
      }
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_current_ws');
      setUser(null);
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      if (socket) socket.disconnect();
    }
  };

  const refreshUser = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        socket
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
