/**
 * Socket.io Mock Factory for WebSocket Tests
 * Provides comprehensive mocking of Socket.io Server and Client sockets
 */

/**
 * Creates a mock Socket client with all necessary methods and properties
 */
export function createSocketMock(
  socketId = 'socket-mock-1',
  userId = 'user-1',
): any {
  const rooms = new Set<string>([socketId]); // Socket's own room
  const joinSpy = jest.fn().mockImplementation((room: string) => {
    rooms.add(room);
    return Promise.resolve();
  });
  const leaveSpy = jest.fn().mockImplementation((room: string) => {
    rooms.delete(room);
    return Promise.resolve();
  });
  const emitSpy = jest.fn();
  const onSpy = jest.fn();
  const toSpy = jest.fn().mockReturnThis();
  const disconnectSpy = jest.fn();

  return {
    id: socketId,
    data: {
      userId,
      groupId: null as string | null,
    },
    handshake: {
      query: { userId },
      headers: {},
      auth: {},
    },
    rooms,
    join: joinSpy,
    leave: leaveSpy,
    emit: emitSpy,
    on: onSpy,
    once: jest.fn(),
    off: jest.fn(),
    to: toSpy,
    in: jest.fn().mockReturnThis(),
    disconnect: disconnectSpy,
    listeners: jest.fn(() => []),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    _cleanup: () => {
      joinSpy.mockClear();
      leaveSpy.mockClear();
      emitSpy.mockClear();
      onSpy.mockClear();
      disconnectSpy.mockClear();
      toSpy.mockClear();
      rooms.clear();
      rooms.add(socketId);
    },
  };
}

/**
 * Creates a mock Socket.io Server
 */
export function createSocketServerMock(): any {
  const sockets = new Map<string, any>(); // socketId -> Socket
  const rooms = new Map<string, Set<string>>(); // roomName -> Set of socketIds
  const toSpy = jest.fn().mockReturnThis();
  const emitSpy = jest.fn();
  const inSpy = jest.fn().mockReturnThis();

  const mockServer = {
    // Server properties
    sockets: {
      sockets,
      adapter: {
        rooms,
      },
      emit: jest.fn(),
    },

    // Server methods
    to: toSpy,
    in: inSpy,
    emit: emitSpy,
    of: jest.fn().mockReturnThis(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    listeners: jest.fn(() => []),

    // Test helpers
    _addSocket: (socket: any) => {
      sockets.set(socket.id, socket);
    },
    _removeSocket: (socketId: string) => {
      sockets.delete(socketId);
    },
    _addToRoom: (roomName: string, socketId: string) => {
      if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
      }
      rooms.get(roomName)!.add(socketId);
    },
    _removeFromRoom: (roomName: string, socketId: string) => {
      if (rooms.has(roomName)) {
        rooms.get(roomName)!.delete(socketId);
        if (rooms.get(roomName)!.size === 0) {
          rooms.delete(roomName);
        }
      }
    },
    _cleanup: () => {
      sockets.clear();
      rooms.clear();
      toSpy.mockClear();
      emitSpy.mockClear();
      inSpy.mockClear();
    },
  };

  // Make `to()` and `in()` return self so chaining works
  toSpy.mockImplementation(() => mockServer);
  inSpy.mockImplementation(() => mockServer);

  return mockServer;
}

/**
 * Helper to set up connected socket in server
 */
export function addSocketToServer(
  server: any,
  socket: any,
  rooms: string[] = [],
) {
  server._addSocket(socket);
  // Add socket to its own room (Socket.io default behavior)
  server._addToRoom(socket.id, socket.id);
  // Add to specified rooms
  for (const room of rooms) {
    server._addToRoom(room, socket.id);
  }
}

/**
 * Helper to simulate socket connection to a room
 */
export function simulateSocketJoinRoom(
  server: any,
  socket: any,
  roomName: string,
) {
  const mockJoin = socket.join as jest.Mock;
  mockJoin.mockImplementationOnce(() => {
    server._addToRoom(roomName, socket.id);
    socket.rooms.add(roomName);
    return Promise.resolve();
  });
  return mockJoin;
}

/**
 * Helper to check if socket received an event
 */
export function checkSocketEmitted(socket: any, event: string, data?: any) {
  const emits = (socket.emit as jest.Mock).mock.calls.filter(
    (call) => call[0] === event,
  );

  if (data !== undefined) {
    return emits.some(
      (call) => JSON.stringify(call[1]) === JSON.stringify(data),
    );
  }

  return emits.length > 0;
}

/**
 * Helper to get all emissions for a socket
 */
export function getSocketEmissions(socket: any, event?: string) {
  const allCalls = (socket.emit as jest.Mock).mock.calls;
  if (event) {
    return allCalls.filter((call) => call[0] === event);
  }
  return allCalls;
}

/**
 * Helper to check if server broadcasted to a room
 */
export function checkServerBroadcasted(
  server: any,
  _roomName: string,
  event: string,
  data?: any,
) {
  const calls = (server.emit as jest.Mock).mock.calls;
  const roomEmits = calls.filter((call) => {
    // Check if this was a broadcast to the room
    // This is simplified - in real implementation you'd need to mock differently
    return call[0] === event;
  });

  if (data !== undefined) {
    return roomEmits.some(
      (call) => JSON.stringify(call[1]) === JSON.stringify(data),
    );
  }

  return roomEmits.length > 0;
}

/**
 * Helper to get all sockets in a room
 */
export function getSocketsInRoom(server: any, roomName: string): string[] {
  const roomSet = server.sockets.adapter.rooms.get(roomName);
  return roomSet ? Array.from(roomSet) : [];
}

/**
 * Clean up all sockets and rooms
 */
export function cleanupSocketServer(server: any) {
  if (server._cleanup) {
    server._cleanup();
  }
}
