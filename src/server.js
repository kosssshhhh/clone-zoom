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

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on('connection', (socket) => {
  socket['nickname'] = 'Anon';

  socket.on('enter_room', (roomName, showRoom) => {
    showRoom();
    socket.join(roomName);
    socket.to(roomName).emit('welcome', socket.nickname, countRoom(roomName));
    wsServer.sockets.emit('room_change', publicRooms());
  });

  // 연결 끊기기 바로 직전에 발생하는 이벤트
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit('bye', socket.nickname, countRoom(room) - 1)
    );
  });

  // 연결이 완전히 해제되었을 떄 발생하는 이벤트
  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', publicRooms());
  });

  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`);
    done();
  });

  socket.on('nickname', (name) => {
    socket['nickname'] = name;
  });
  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter);
    console.log(`Socket Event: ${event}`);
  });
});

const handleListen = () => console.log('Listening on http://localhost:3000');

httpServer.listen(3000, handleListen);
