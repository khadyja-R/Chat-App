const express = require('express');
const cors = require('cors');
const r = require('rethinkdb');
const socketIO = require('socket.io');
const http = require('http');

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

const dbName = 'chat_app';
const tableName = 'messages';

r.connect({ host: 'localhost', port: 28015, db: dbName }, (err, connection) => {
  if (err) throw err;

  r.dbCreate(dbName).run(connection, (err, result) => {
    if (err && !err.message.includes('already exists')) {
      throw err;
    }

    r.db(dbName).tableCreate(tableName).run(connection, (err, result) => {
      if (err && !err.message.includes('already exists')) {
        throw err;
      }

      io.on('connection', (socket) => {
        console.log('A user connected.');

        socket.on('auth', (username) => {
          socket.username = username;
        });

        socket.on('new-message', (message) => {
          console.log("test some isuue i'm calling now ");
          message.username = socket.username;
          message.createdAt = new Date();
          r.table(tableName)
            .insert(message)
            .run(connection, (err, result) => {
              if (err) {
                console.error(err);
              } else {
                io.emit('new-message', message);
              }
            });
        });

        socket.on('disconnect', () => {
          console.log('A user disconnected.');
        });
      });

      app.get('/messages', (req, res) => {
        r.table(tableName)
          .orderBy(r.asc('createdAt'))
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

              res.json(result);
            });
          });
      });

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
