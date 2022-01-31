const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.set("views", `${__dirname}/views/`);

const botName = 'TeChat';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, `Welcome to ${user.room}`));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `Welcome ${user.username} to the ${user.room} room!`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

app.get(["/", "/home"], (req, res) => {
  res.status(200).render("index", { link: path.join(__dirname, 'views', 'index.ejs') });
});

app.get(["/developer", "/developers"], (req, res) => {
  res.status(200).render("developer", { link: path.join(__dirname, 'views', 'developer.ejs') });
})

app.get("/privacy", (req, res) => {
  res.status(200).render("uc", { link: path.join(__dirname, 'views', 'uc.ejs') });
})

app.get("/about", (req, res) => {
  res.status(200).render("uc", { link: path.join(__dirname, 'views', 'uc.ejs') });
})

app.get("/login", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'public', 'login.html'));
})

app.get("/uc", (req, res) => {
  res.status(200).render("uc", { link: path.join(__dirname, 'views', 'uc.ejs') });
})

app.use(function (req, res, next) {
  res.status(404).render("404", { link: path.join(__dirname, 'views', '404.ejs') });
})

const PORT = 2000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
