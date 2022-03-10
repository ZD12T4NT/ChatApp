const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')


const app = express();
const server = http.createServer(app);
const io = socketio(server)

// set staitc folder 
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'LetsChat Bot';


// run when a client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room}) => {

        const user = userJoin(socket.id, username, room)

        socket.join(user.room)

        // welcomes the user
        socket.emit('message', formatMessage(botName, 'Welcome to LetsChat!')); // emits to single client connection


        // broadcast when a user connects 
        socket.broadcast.to(user.room).emit ('message', formatMessage(botName, `${user.username} has joined the chat`)
        ); // emmits to all the clients expect the one connecting 

        // send users and room info

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });


   

    // listen for message sent 
    socket.on('chatMessage', (msg) => {

        const user = getCurrentUser(socket.id)
       
        io.to(user.room).emit('message', formatMessage(user.username,msg));// sends the message to everyone in the chat
    });

     // runs when a client disconnects 
     socket.on('disconnect', () => {

        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message', 
                formatMessage(botName, `${user.username} has left the chat`)
                );
                
        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

     }

    });
       

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`server running on port ${PORT}`));