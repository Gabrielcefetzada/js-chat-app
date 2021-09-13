const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cors = require('cors');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js')

const PORT = process.env.PORT || 5000

const router = require('./router')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(cors());
app.use(router);

io.on('connect', (socket) => {
    socket.on('join', ({ name, room }, callback) => {
      const { error, user } = addUser({ id: socket.id, name, room });
  
      if(error) return callback(error);
  
      socket.join(user.room);
  
      socket.emit('message', { user: 'chat', text: `${user.name}, welcome to room ${user.room}.`});
      socket.broadcast.to(user.room).emit('message', { user: 'chat', text: `${user.name} has joined!` });
  
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
  
      callback();
    });
  
    socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id);
  
      io.to(user.room).emit('message', { user: user.name, text: message });
      io.to(user.room).emit('roomData', { user: user.room, text: message });
  
      callback();
    }); 

    socket.on('disconnect', () => {
       const user = removeUser(socket.id)
       if(user){
         io.to(user.room).emit('message', { user: 'chat', text: `User ${user.name} has left.`})
       }
    })
})

server.listen(PORT, () => console.log(`server is running on port ${PORT}`))