const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json());

let currentVideo = "";
let currentText = "";
let peers = {};

app.post('/update', (req, res) => {
    const { video, text } = req.body;
    if (video) currentVideo = video;
    if (text) currentText = text;

    io.emit('update', { video: currentVideo, text: currentText });
    res.json({ success: true });
});

// WebRTC signaling
io.on('connection', (socket) => {
    console.log("New client connected:", socket.id);

    socket.emit('update', { video: currentVideo, text: currentText });

    socket.on('offer', (data) => {
        peers[data.to] = socket.id;
        io.to(data.to).emit('offer', { from: socket.id, offer: data.offer });
    });

    socket.on('answer', (data) => {
        io.to(peers[data.to]).emit('answer', { answer: data.answer });
    });

    socket.on('candidate', (data) => {
        io.to(data.to).emit('candidate', { candidate: data.candidate });
    });

    socket.on('disconnect', () => {
        console.log("Client disconnected:", socket.id);
        delete peers[socket.id];
    });
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
