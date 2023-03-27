
// Import required packages
const express = require('express');
const cors = require('cors');
const r = require('rethinkdb');
const socketIO = require('socket.io');
const http = require('http');

// Create Express app
const app = express();

// Configure CORS options
const corsOptions = {
  origin: 'http://localhost:3000', // Only allow requests from this domain
  credentials: true // Allow sending cookies with requests
};

// Use CORS middleware with configured options
app.use(cors(corsOptions));

// to parse incoming JSON data in the request body of HTTP requests.

app.use(express.json());

// Create HTTP server using the Express app
const server = http.createServer(app);

// Create Socket.IO instance using the HTTP server and configured options
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000', // Only allow connections from this domain
    credentials: true // Allow sending cookies with requests
  }
});

// Define database and table names
const dbName = 'chat_app';
const tableName = 'messages';

// Connect to RethinkDB instance
r.connect({ host: 'localhost', port: 28015, db: dbName }, (err, connection) => {
  if (err) throw err;

  // Create database if it doesn't exist
  r.dbCreate(dbName).run(connection, (err, result) => {
    if (err && !err.message.includes('already exists')) {
      throw err;
    }

    // Create table if it doesn't exist
    r.db(dbName).tableCreate(tableName).run(connection, (err, result) => {
      if (err && !err.message.includes('already exists')) {
        throw err;
      }

      // Handle Socket.IO connections
      io.on('connection', (socket) => {
        console.log('A user connected.');

        // Handle 'auth' event (sent when user authenticates with a username)hhhhhhhhhh
        socket.on('auth', (username) => {
          socket.username = username; // Store the username in the socket object
        });

        // Handle 'new-message' event (sent when user sends a new chat message)
        socket.on('new-message', (message) => {
          console.log("test some issuue i'm here  now ");
          message.username = socket.username; // Add the username to the message object
          message.createdAt = new Date(); // Add the current time to the message object
          r.table(tableName)
            .insert(message) // Insert the message into the database
            .run(connection, (err, result) => {
              if (err) {
                console.error(err);
              } else {
                io.emit('new-message', message); // Send the message to all connected clients
              }
            });
        });

        // Handle 'disconnect' event (sent when user disconnects from Socket.IO)
        socket.on('disconnect', () => {
          console.log('A user disconnected.');
        });
      });

      // Handle HTTP GET request to fetch all chat messages
      app.get('/messages', (req, res) => {
        r.table(tableName)
          .orderBy(r.asc('createdAt')) // Sort by message creation time
          .run(connection, (err, cursor) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Error fetching messages');
            }

            cursor.toArray((err, result) => {
              if (err) {
                console.error(err);
                return res.status(500).send('Error fetching messages');
              }

              res.json(result); // Send the messages as a JSON array
            });
          });
      });

      // // Handle HTTP POST request to create a
      app.post('/messages', (req, res) => {
        const message = req.body;
        message.createdAt = new Date();

        r.table(tableName)
          .insert(message)
          .run(connection, (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Error posting message');
            }

            res.json(result);
          });
      });

      server.listen(3002, () => {
        console.log('Server listening on port 3002');
      });
    });
  });
});
