import http from 'http';
import SocketIO, { Socket } from 'socket.io';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on('connection', (socket) => {
  socket['nickname'] = 'Anon';

  socket.on('enter_room', (roomName, showRoom) => {
    showRoom();
    socket.join(roomName);
    socket.to(roomName).emit('welcome', socket.nickname);
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit('bye', socket.nickname)
    );
  });

  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`);
    done();
  });

  socket.on('nickname', (name) => {
    socket['nickname'] = name;
  });
});

const handleListen = () => console.log('Listening on http://localhost:3000');

httpServer.listen(3000, handleListen);
