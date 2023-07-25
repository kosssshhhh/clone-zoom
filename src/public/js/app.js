const socket = io();

const welcome = document.querySelector('#welcome');
const form = welcome.querySelector('form');

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector('input');
  socket.emit('enter_room', { payload: input.value });
  input.value = '';
}

form.addEventListener('submit', handleRoomSubmit);
