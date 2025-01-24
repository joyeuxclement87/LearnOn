// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let activeUsers = [];

io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Handle incoming messages
    socket.on('message', (data) => {
        io.emit('message', data);  // Broadcast message to all clients
    });

    // Handle user typing
    socket.on('typing', () => {
        socket.broadcast.emit('typing');
    });

    // Handle file uploads
    socket.on('file', (data) => {
        io.emit('file', data);  // Broadcast file to all clients
    });

    // Handle new users
    socket.on('newUser', (username) => {
        activeUsers.push(username);
        io.emit('activeUsers', activeUsers);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        activeUsers = activeUsers.filter(user => user !== socket.username);
        io.emit('activeUsers', activeUsers);
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

