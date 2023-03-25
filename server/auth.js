const socketIO = require('socket.io');

const users = {};

module.exports = (server) => {
  const io = socketIO(server);

  io.on('connection', (socket) => {
    console.log('A user connected.');

    // Handle user authentication
    socket.on('auth', (username, callback) => {
      if (!username || username.trim() === '') {
        callback({ error: 'Username is required.' });
      } else if (users[username]) {
        callback({ error: 'Username is already taken.' });
      } else {
        socket.username = username;
        users[username] = socket.id;
        callback({ success: true });
      }
    });

    // Listen for incoming messages from clients
    socket.on('new-message', (message) => {
      // Only emit the new message to the intended recipient
      io.to(users[message.recipient]).emit('new-message', message);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected.');
      delete users[socket.username];
    });
  });

  return io;
};
