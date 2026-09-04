// Socket.IO initialization placeholder
const { Server } = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, { cors: { origin: '*' } });
    io.on('connection', (socket) => {
      console.log('Realtime client connected', socket.id);
      socket.on('disconnect', () => console.log('Disconnected', socket.id));
    });
    return io;
  },
  getIO: () => io
};
