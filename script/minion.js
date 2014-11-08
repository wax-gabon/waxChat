
//_________________________________________________________________ Tableau Users et Markers
Users=[];
Markers=[];
Pseudos=[];
bulleFerme=true;

//_________________________________________________________________ IO
var socket = io.connect('http://192.168.111.100:8080');
//var socket = io.connect('http://ttgs.dlinkddns.com:8080');

//_________________________________________________________________ Sur Connexion
socket.on('connect', function(){
  document.getElementById('avatar').value = '/avatar/P_1.png';
  socket.emit('upPseudo');
});

$(function(){

//_________________________________________________________________ Sur Connexion Pseudo
$('#PseudoCnx').click( function() {

//___________________________________________________ Si le pseudo est rempli et n'existe pas deja
var pseudo=document.getElementById('Pseudo').value;
if (pseudo!='' && Pseudos.indexOf(pseudo)==-1 && pseudo != NaN && pseudo != undefined && pseudo != null) {

//___________________________________________________ IO Ajoute Pseudo


if (document.getElementById('room').value=='') { document.getElementById('room').value='Public';}

document.getElementById('rooms').value=document.getElementById('room').value;

document.title= document.getElementById('Pseudo').value + ' @ \''+document.getElementById('rooms').value+'\'';

socket.emit('adduser',
  document.getElementById('Pseudo').value,
  document.getElementById('latitude').value,
  document.getElementById('longitude').value,
  document.getElementById('avatar').value,
  document.getElementById('rooms').value);

$('#Cnx').fadeOut();$('#FenDrag').css('height','510px');$('#Bordure').css('height','440px');
$('#Chat').fadeIn();
document.title= document.getElementById('Pseudo').value + ' @ \''+document.getElementById('rooms').value+'\'';
$("#favicon").attr("href",document.getElementById('avatar').value );

}else{

  $('#Chat').fadeOut();$('#FenDrag').css('height','345px');$('#Bordure').css('height','275px');
  $('#Cnx').fadeIn();

  if (document.getElementById('Pseudo').value==''){
    alert('Vous devez saisir un Pseudo !');
  }else{alert('Ce pseudo \' '+$('#Pseudo').val()+' \' existe déja !');};

  $('#Pseudo').val('');$('#Pseudo').focus();

};

});
});

//_________________________________________________________________ webRTC
socket.on('RTC', function (snd,rcv,clef){
  if (document.getElementById('Pseudo').value==rcv) {
    $("#RTC").html("").html("<div onclick='Ferme();' id='Ferme'>x</div><div id='Tete'>"+snd+"</div><iframe src='https://apprtc.appspot.com/?r="+snd+clef+"' id='webRTC'></iframe>").fadeIn();
  }
});

//_________________________________________________________________ Deconnection
socket.on('reboot', function () {
  location.reload();
});

//_________________________________________________________________ upDate Chat
socket.on('updatechat', function (username, data) {
  $("#Logo").fadeOut().fadeIn();
  $('#conversation').prepend('<b>'+username + ':</b> ' + data + '<br><br>');
});



//_________________________________________________________________ upDate MsgPrivate
socket.on('Private', function (username, rcv, data) {
  if (document.getElementById('Pseudo').value==rcv) {
    $("#Logo").fadeOut().fadeIn();
    $('#conversation').prepend('<b>'+username + ':</b> ' + data + '<br><br>');};
  });

//_________________________________________________________________ upDate Rcv
socket.on('updateRcv', function (username, rcv, data) {
  if (document.getElementById('Pseudo').value==rcv) {
    $("#Logo").fadeOut().fadeIn();
    $('#conversation').prepend('<b>'+username + ':</b> ' + data + '<br><br>');};
  });

//_________________________________________________________________ upAvatar
socket.on('upAvatar', function (username,Latitude,Longitude,Avatar) {

  if (Users.indexOf(username)!=-1 && username != '' && username != NaN && username != undefined && username != null) {
    var Pos=jQuery.inArray(username, Users)
    var latlng = new google.maps.LatLng(Latitude,Longitude);
    Markers[Pos].setPosition(latlng);
  }

  if (Users.indexOf(username)==-1 && username != '' && username != NaN && username != undefined && username != null) {
    getMarker(Latitude,Longitude,username,Avatar);
  }

});

//_________________________________________________________________ upPseudo
socket.on('upPseudo', function (username) {
  var Pos=jQuery.inArray(username, Pseudos)
  if (Pos == -1) {
    Pseudos[Pseudos.length] = username;
  }
});

//_________________________________________________________________ SupPseudo
socket.on('SupPseudo', function (username) {

  var Pos=jQuery.inArray(username, Pseudos)
  if (Pos != -1) {
    Pseudos.splice(Pos, 1);
  }
});

//_________________________________________________________________ Supprime Avatar
socket.on('SupAvatar', function (username) {

  var Pos=jQuery.inArray(username, Users)

  if (Pos != -1) {
    var marker = Markers[Pos];
    marker.setMap(null);
    Users.splice(Pos, 1);
    Markers.splice(Pos, 1);
  }
});


//_________________________________________________________________ Sur envoi de message
$(function(){
    // when the client clicks SEND
    $('#datasend').click( function() {
      var message = $('#data').val();
      $('#data').val('');
      // tell server to execute 'sendchat' and send along one parameter
      if (message!='') {
        socket.emit('sendchat', message);
        $('#data').focus();};
      });

    // when the client hits ENTER on their keyboard
    $('#data').keypress(function(e) {
      if(e.which == 13) {
        $(this).blur();
        $('#datasend').focus().click();
      }
    });
  });

//_________________________________________________________________ Sur switchRoom
function switchRoom(){
  if (document.getElementById('room').value=='') { document.getElementById('rooms').value='Public';}
  else{document.getElementById('rooms').value=document.getElementById('room').value};
  socket.emit('switchRoom', '\''+document.getElementById('rooms').value+'\'');(username,avatar,newroom)
  document.title= document.getElementById('Pseudo').value + ' @ \''+document.getElementById('rooms').value+'\'';
}

//_________________________________________________________________ Selection de l'avatar
var PosAvatar = 1;

function Avatars(Sens)
{
  if (Sens=='+') {PosAvatar=PosAvatar+1;if (PosAvatar==33) {PosAvatar=1};
}else{PosAvatar=PosAvatar-1;if (PosAvatar==0) {PosAvatar=32};};

$('#Avatar').css('background','url(/avatar/'+PosAvatar.toString()+'.png) no-repeat scroll 0% 0% / 100px 100px transparent');

document.getElementById('avatar').value = '/avatar/P_'+PosAvatar.toString()+'.png';
}

//_________________________________________________________________ Sur connexion GoogleMap
function getOpen()
{
  if (navigator.geolocation)
  {
    navigator.geolocation.getCurrentPosition(getMap,showError);
  }
  else{alert("Geolocation is not supported by this browser.");}
}

//_________________________________________________________________ Position du Pseudo
function getMap(position)
{
  map = new google.maps.Map(document.getElementById("map_canvas"), {
    zoom: 12,
    center: new google.maps.LatLng(position.coords.latitude,position.coords.longitude),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  document.getElementById('latitude').value = position.coords.latitude;
  document.getElementById('longitude').value = position.coords.longitude;
}

//_________________________________________________________________ Mouvement du Pseudo
function getLocation()
{
  if (navigator.geolocation)
  {
    navigator.geolocation.getCurrentPosition(getPosition,showError);
  }
  else{alert("Geolocation is not supported by this browser.");}
}
function getPosition(position)
{

  if (document.getElementById('latitude').value != position.coords.latitude || document.getElementById('longitude').value != position.coords.longitude) {
    document.getElementById('latitude').value = position.coords.latitude;
    document.getElementById('longitude').value = position.coords.longitude;

    socket.emit('moovUser',
      document.getElementById('Pseudo').value,
      document.getElementById('latitude').value,
      document.getElementById('longitude').value,
      document.getElementById('avatar').value);
  }

  setTimeout(getLocation,1000);
}

//_________________________________________________________________ Affichage de l'avatar
function getMarker(lat,lon,uti,avatar)
{

  var pinImage = new google.maps.MarkerImage(avatar,
    new google.maps.Size(50, 50),
    new google.maps.Point(0,0));

  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(lat,lon),
    animation: google.maps.Animation.DROP,
    icon: pinImage,
    map: map
  });

//_________________________________________________________________ Ajout marker dans Markers
var Pos=jQuery.inArray(uti, Users)
if (Pos == -1) {
  Users[Users.length] = uti;
  Markers[Markers.length] = marker;
}else{
  Users[Pos] = uti;
  Markers[Pos] = marker;
}

    //Ajout de la fenetre d'informations au marqueur
    var contenu = '<b>'+uti+'</b>';
    var snd=document.getElementById('Pseudo').value;
    var rcv=uti;
    var infowindow = new google.maps.InfoWindow({
      content: contenu
    });

//if('+snd+'!='+rcv+'){webRTC(\''+snd+'\',\''+rcv+'\');}else{alert("Vous ne pouvez pas faire un videoChat à vous même !")};

var content = '<div style="text-align:center;font-size:14px;"><b>'+rcv+'</b></div><button onmouseover="Bulle(\'MsgPrivate\');" id="MsgPrivate" onclick="var msg=prompt(\'Indiquez votre message privé\');myPrivate(\''+snd+'\',\''+rcv+'\',msg);">Message privé</button><button onmouseover="Bulle(\'StreamVideo\');" onclick="webRTC(\''+snd+'\',\''+rcv+'\');" id="StreamVideo">Streaming Video</button><button onclick="'+rcv+'.document.getElementById(\'snd\').value=\''+snd+'\';'+rcv+'.document.getElementById(\'rcv\').value=\''+rcv+'\';'+rcv+'.document.Load.uploadfile.click();" onmouseover="Bulle(\'FileSend\');" id="FileSend">Envoyer un fichier</button><iframe style="display:none;" src="/upload" width="100" height="100" name="'+rcv+'" id="'+rcv+'"></iframe>' ;

var infoBubble = new InfoBubble({map: map,content:content,hideCloseButton:true});

google.maps.event.addListener(map, "click", function () {
  infoBubble.close();
});


      //Création du listener du clic de souris sur le marqueur
      google.maps.event.addListener(marker, 'click', function() {
        if (!infoBubble.isOpen()) {
          infowindow.close(map,this);
          infoBubble.open(map, this);
          infoBubble.setMaxWidth('160');
        }});

      if (document.getElementById('Pseudo').value == uti ){getLocation();};

      //Création du listener du mouseover de souris sur le marqueur
      google.maps.event.addListener(marker, 'mouseover', function() {
       if (!infoBubble.isOpen()) {
        infowindow.open(map,this);
        Bulle('canvas');
      }});

      //Création du listener du mouseout de souris sur le marqueur
      google.maps.event.addListener(marker, 'mouseout', function() {
        infowindow.close(map,this);
      });

//_________________________________________________________________ Beep
$('#son')[0].play();
}

//_________________________________________________________________ Sur msgPrivate
function myPrivate(snd,rcv,msg)
{
  if (msg) {
    socket.emit('MsgPrivate', snd,rcv,msg);
  }
}

//_________________________________________________________________ upLoad
function upLoad(snd,rcv,chemin)
{
  if (chemin) {
    var startIndex = (chemin.indexOf('\\') >= 0 ? chemin.lastIndexOf('\\') : chemin.lastIndexOf('/'));
    var chemin = chemin.substring(startIndex);
    if (chemin.indexOf('\\') === 0 || chemin.indexOf('/') === 0) {
      chemin = chemin.substring(1);
    }
    socket.emit('upLoad', snd,rcv,chemin);
  }
}

//_________________________________________________________________ Erreurs GoogleMap
function showError(error)
{
  switch(error.code)
  {
    case error.PERMISSION_DENIED:
    alert("User denied the request for Geolocation.")
    break;
    case error.POSITION_UNAVAILABLE:
    alert("Location information is unavailable.")
    break;
    case error.TIMEOUT:
    alert("The request to get user location timed out.")
    break;
    case error.UNKNOWN_ERROR:
    alert("An unknown error occurred.")
    break;
  }
}

//_________________________________________________________________ webRTC
function webRTC(snd,rcv){
  var num = Math.floor(Math.random() * 501);
  var clef= num.toString();
  $("#RTC").html("").html("<div onclick='Ferme();' id='Ferme'>x</div><div id='Tete'>"+rcv+"</div><iframe src='https://apprtc.appspot.com/?r="+snd+clef+"' id='webRTC'></iframe>").fadeIn();

  var msg= '<span style="cursor:pointer;color:Red;" onclick="Video(\''+snd+'\',\''+rcv+'\','+clef+');">Accepter l\'invitation videoChat</span>'

  socket.emit('MsgVideo', snd,rcv,msg);

}

function Video(snd,rcv,clef){
  socket.emit('RTC',snd,rcv,clef);
}

function Ferme(){$("#RTC").html("").hide();}

getOpen();

if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/iPad/i))) {$("button").click(function(){});};

window.onload=function(){document.getElementById('room').value = document.location.href.substring(document.location.href.lastIndexOf( "/" )+2 );};

function Bulle(exp){
  if (bulleFerme) {

   switch (exp) {
     case 'map_canvas' :
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();bulleFerme=false;' id='Ferme'>x</div>"+"<b>minionChat</b><br><br>Idéal pour communiquer entre vous, cette application est compatible tous navigateurs, et, accessible librement. Elle permet :<br><br>-Avatars géolocalisés<br>-Chat public et privé<br>-Messages privés<br>-Streamming vidéo<br>-Partage de fichiers<br><br>Vous devez accepter l\'option géolocalisation, et, vous connecter pour voir les avatars géolocalisés.<br><br>Enjoy !").fadeIn();break;
     case 'Avatar':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Choisissez un avatar pour qu’il apparaisse géolocalisé sur la carte.").fadeIn();break;
     case 'Pseudo':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Saisissez un pseudo, les autres utilisateurs vous reconnaîtront sur la carte.").fadeIn();break;
     case 'Logo':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cette fenêtre est draggable.<br>Double cliquez dessus pour masquer le mode chat ou le mode connexion.").fadeIn();break;
     case 'RTC':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cette fenêtre est draggable.<br>Chat en streaming vidéo entre vous et l\'avatar sélectionné.<br>Vous devez accepter l\'option partage vidéo et audio pour le stream.").fadeIn();break;
     case 'datasend':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cliquez pour envoyer votre message à tous les connectés de la \’room\’.").fadeIn();break;
     case 'data':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Ecrivez un message à envoyer.").fadeIn();break;
     case 'conversation':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Historique du Chat.").fadeIn();break;
     case 'Droite':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cliquez pour obtenir l’avatar suivant.").fadeIn();break;
     case 'Gauche':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cliquez pour obtenir l’avatar précédant.").fadeIn();break;
     case 'room':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Saisissez une \'room\' privée et demandez à d'autres utilisateurs de vous retrouver dans cette \'room\'.").fadeIn();break;
     case 'StreamVideo':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cliquez pour activer une session de streamming avec l\'avatar sélectionné.").fadeIn();break;
     case 'FileSend':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cliquez pour envoyer un fichier à l\'avatar sélectionné.").fadeIn();break;
     case 'MsgPrivate':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cliquez pour envoyer un message privé à l\'avatar sélectionné.").fadeIn();break;
     case 'canvas':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Avatar géolocalisé, Cliquez pour plus d\'options avec cet avatar.").fadeIn();break;
     case 'PseudoCnx':
     $( "#bulle" ).html("<div onclick='$(\"#bulle\").fadeOut();' id='Ferme'>x</div>"+"Cliquez pour vous connecter sous votre pseudo, Vous serez automatiquement géolocalisé.").fadeIn();break;
     default:
     $( "#bulle" ).fadeOut();
   }

 }else{$( "#bulle" ).fadeOut();}

}