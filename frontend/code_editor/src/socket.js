import { io } from "socket.io-client";

let socket = null;

/**
 * Get singleton socket instance
 */
export const getSocket = () => {
  if (!socket) {
    socket = io("http://127.0.0.1:5000", {
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
};

/**
 * Connect socket safely (no duplicate connects)
 */
export const connectSocket = () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const s = getSocket();

  if (s.connected) return; // ✅ already connected

  s.auth = { token };
  s.connect();
};

/**
 * Disconnect socket safely
 */
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
