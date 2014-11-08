
var express = require('express');
var connect = require('connect');
var fs = require('fs');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//var minion = require('mongodb').MongoClient;

var mongo = require('mongodb');
var server = new mongo.Server('127.0.0.1', 27017, {auto_reconnect: true});
var db = new mongo.Db('minion', server, {});

db.open(function(err) {console.log("connecté avec MongoDB !!");});
var chat;chat = db.collection('chat');
var action;action = db.collection('action');


app.use(connect.bodyParser({ uploadDir:__dirname + '/uploads' , limit: 2097152, keepExtensions: true }));

app.get('/upload', function(req, res) {
  res.sendfile(__dirname + '/iframe.html');
});

app.post('/upload', function(req, res){
  var temp_path = req.files.uploadfile.path;
  var save_path = __dirname + '/uploads/' + req.files.uploadfile.name;
  fs.rename(temp_path, save_path, function(error){
    fs.unlink(temp_path, function(){
      console.log(req.body.user.snd+" a "+req.body.user.rcv+": " + save_path);
      res.sendfile(__dirname + '/iframe.html');

    });
  });
});

//app.listen(8000);

// routing

app.get('/@*', function (req, res) {
  console.log('%s %s', req.method, req.url);
  var ua = req.header('user-agent');if(/mobile/i.test(ua)||/Android/.test(ua)||/like Mac OS X/.test(ua)) {res.sendfile(__dirname + '/mobile.html');}else{ res.sendfile(__dirname + '/index.html');}
});

app.get('/apple', function (req, res) {
  console.log('%s %s', req.method, req.url);
  res.sendfile(__dirname + '/mobile.html');
});

app.get('/', function (req, res) {
  var ua = req.header('user-agent');if(/mobile/i.test(ua)||/Android/.test(ua)||/like Mac OS X/.test(ua)) {res.sendfile(__dirname + '/mobile.html');}else{ res.sendfile(__dirname + '/index.html');}
});

app.get('/app.js', function(req, res){res.send(404, 'Sorry, we cannot find that!');});

app.use(express.static(__dirname));

//io.on('connection', function(socket){var d = new Date();});

http.listen(8080,function(req, res) {console.log('Ecoute http sur :8080 !!');});

//_________________________________________________________________ Tableaux
usernames = {};

// rooms which are currently available in chat
Rooms = [];

Users = []; 
Avatars = []; 
Latitude = []; 
Longitude = []; 

io.sockets.on('connection', function (socket) {

//_________________________________________________________________ Envoi tous les pseudo a la connexion
socket.on('upPseudo', function () {
  for (var i = 0; i < Users.length; i++) {
    socket.emit('upPseudo', Users[parseInt(i)] );
  }
});

//_________________________________________________________________ Sur webRTC
socket.on('RTC', function (snd,rcv,clef) {
  if (Users.indexOf(socket.username)!=-1 && socket.username != '' && socket.username != undefined && socket.username != null) {
    io.sockets.in(socket.room).emit('RTC', snd,rcv,clef);
    action.insert({timeStamp: Math.round((new Date()).getTime() / 1000),action: snd+' webRTC '+rcv});
  }else{
    socket.to(socket.room).emit('reboot');}
  });

//_________________________________________________________________ Sur MsgVideo
socket.on('MsgVideo', function (snd,rcv,msg) {
  if (Users.indexOf(socket.username)!=-1 && socket.username != '' && socket.username != undefined && socket.username != null) {
    var dataSnd='Demande de videoChat';
    var dataRcv=msg;
    socket.emit('Private', snd, rcv, dataSnd,Avatars[Users.indexOf(snd)]);
    socket.to(socket.room).emit('Private', snd, rcv, dataRcv,Avatars[Users.indexOf(snd)]);
  }else{
    socket.to(socket.room).emit('reboot');}
  });

//_________________________________________________________________ Sur MsgPrivate
socket.on('MsgPrivate', function (snd,rcv,msg) {
  if (Users.indexOf(socket.username)!=-1 && socket.username != '' && socket.username != undefined && socket.username != null) {
    var data='<span style="color:Red;">'+msg+'</span>';
    socket.emit('Private', snd, rcv, data,Avatars[Users.indexOf(snd)]);
    socket.to(socket.room).emit('Private', snd, rcv,data,Avatars[Users.indexOf(snd)]);
    action.insert({timeStamp: Math.round((new Date()).getTime() / 1000),action: snd+' msgPrivate '+rcv});
  }else{
    socket.to(socket.room).emit('reboot');}
  });

//_________________________________________________________________ Sur upLoad
socket.on('upLoad', function (snd,rcv,chemin) {
  if (Users.indexOf(socket.username)!=-1 && socket.username != '' && socket.username != undefined && socket.username != null) {
    var data='<a href="'+'./uploads/'+chemin+'" target="_blank">'+chemin+'</a>';
    socket.emit('Private', snd, rcv, data,Avatars[Users.indexOf(snd)]);
    socket.to(socket.room).emit('Private', snd, rcv,data,Avatars[Users.indexOf(snd)]);
    action.insert({timeStamp: Math.round((new Date()).getTime() / 1000),action: snd+' upLoad '+rcv});
  }else{
    socket.to(socket.room).emit('reboot');}
  });

//_________________________________________________________________ Sur click envoi chat
socket.on('sendchat', function (data) {
  if (Users.indexOf(socket.username)!=-1 && socket.username != '' && socket.username != undefined && socket.username != null) {

    io.sockets.in(socket.room).emit('updatechat', socket.username, data,Avatars[Users.indexOf(socket.username)]);

//_________________________________________________________________ Stock dans minion
var timeStamp = Math.round((new Date()).getTime() / 1000);
chat.insert({timeStamp: timeStamp,name: socket.username, message: data}, function(err, result) {if(err)throw err;console.log(timeStamp+" : "+socket.username+" : "+data);});
}else{
  socket.to(socket.room).emit('reboot');}
});

//_________________________________________________________________ Sur ajout d'un pseudo
socket.on('adduser', function(username,latitude,longitude,avatar,room){
  if (Users.indexOf(username)==-1 && username != '' && username != undefined && username != null) {

    Rooms.push(room);
    Users.push(username);
    Avatars.push(avatar);
    Latitude.push(latitude);
    Longitude.push(longitude);


    // we store the username in the socket session for this client
    socket.username = username;

    // store the room name in the socket session for this client
    socket.room = room;

    // add the client's username to the global list
    usernames[username] = username;

    // send client to room 1
    socket.join(room);
    socket.emit('updatechat', username, 'Vous êtes connecté...@'+ room,Avatars[Users.indexOf(username)]);

    // echo to client they've connected
    //socket.emit('updatechat', username, 'Vous êtes connecté...');
    socket.broadcast.emit('upPseudo',username );

    // echo globally (all clients) that a person has connected
    socket.broadcast.to(room).emit('updatechat', username, 'C\'est connecté...' ,Avatars[Users.indexOf(username)]);

    // echo globally (all clients) that a person has Geolokalized
    socket.broadcast.to(room).emit('upAvatar', username,latitude,longitude,avatar );
    socket.emit('updaterooms', Rooms, room);

   // socket.emit('upAvatar', username,latitude,longitude,avatar );

   for (var i = 0; i < Users.length; i++) {
    if (Rooms[parseInt(i)]==room) {
      socket.emit('upAvatar', Users[parseInt(i)],Latitude[parseInt(i)],Longitude[parseInt(i)],Avatars[parseInt(i)] );
    };
    socket.emit('upPseudo',Users[parseInt(i)] );

    action.insert({timeStamp: Math.round((new Date()).getTime() / 1000),action: username+' Pseudo '+avatar+' @ '+room});
  }

  var d = new Date(); 
  console.log(username+' connecté @ '+room+' le '+d.toLocaleDateString()+' à '+d.toLocaleTimeString()+' '+avatar+' '+Latitude+' '+longitude);

};
});

//_________________________________________________________________ Sur changement de room 
socket.on('switchRoom', function(username,avatar,newroom){

 Rooms[Users.indexOf(pseudo)]=room;

    // leave the current room (stored in session)
    socket.leave(socket.room);

    // join new room, received as function parameter
    socket.join(newroom);
    socket.emit('updatechat', socket.username, 'Vous êtes connecté...@'+ newroom,Avatars[Users.indexOf(username)]);

    // sent message to OLD room
    socket.broadcast.to(socket.room).emit('updatechat', socket.username,'C\'est déconnecté...',Avatars[Users.indexOf(username)]);
    console.log(socket.username+' C\'est déconnecté...'+socket.room);

    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('updatechat', socket.username,'C\'est connecté...',Avatars[Users.indexOf(username)]);
    socket.emit('updaterooms', Rooms, newroom);
    console.log(socket.username+' C\'est connecté...'+newroom);

    for (var i = 0; i < Users.length; i++) {
      if (Rooms[parseInt(i)]==newroom) {
        socket.emit('upAvatar', Users[parseInt(i)],Latitude[parseInt(i)],Longitude[parseInt(i)],Avatars[parseInt(i)] );
      }
    }

  });

//_________________________________________________________________ Sur deplacement d'un pseudo
socket.on('moovUser', function(username,latitude,longitude,avatar){
  if (Users.indexOf(username)!=-1 && username != '' && username != NaN && username != undefined && username != null) {
    var Pos=Users.indexOf(username);
    Avatars[Pos]=avatar;
    Latitude[Pos]=latitude;
    Longitude[Pos]=longitude;

    socket.broadcast.to(socket.room).emit('upAvatar', username,latitude,longitude,avatar );
    socket.to(socket.room).emit('upAvatar', username,latitude,longitude,avatar );

  };
});

//_________________________________________________________________ Sur deconnexion
socket.on('disconnect', function(){

  if (Users.indexOf(socket.username)!=-1 && socket.username != '' && socket.username != NaN && socket.username != undefined && socket.username != null) {

    var d = new Date(); 
    var Pos=Users.indexOf(socket.username);
    console.log(socket.username+' déconnecté @ '+Rooms[Pos]+' le '+d.toLocaleDateString()+' à '+d.toLocaleTimeString());

    action.insert({timeStamp: Math.round((new Date()).getTime() / 1000),action: socket.username+' deconnexion'});

    // echo globally that this client has left
    socket.broadcast.emit('SupPseudo', socket.username);
    socket.broadcast.to(socket.room).emit('SupAvatar', socket.username);
    socket.broadcast.to(socket.room).emit('updatechat', socket.username,'C\'est déconnecté...',Avatars[Users.indexOf(socket.username)]);
    socket.leave(socket.room);

    delete usernames[socket.username];

    Users.splice(Pos,1);
    Rooms.splice(Pos,1);
    Avatars.splice(Pos,1);
    Latitude.splice(Pos,1);
    Longitude.splice(Pos,1);
  }
});
});
