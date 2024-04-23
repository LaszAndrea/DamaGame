//define things for the websocket

const http = require("http");
const express = require("express");
const websocket = require("websocket");
const path = require('path')

const app = express();

//include all files
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname + '/client')));
app.use(express.static(path.join(__dirname + '/client/Sitelogic.js')));
app.use(express.static(path.join('/client/imageref')));

//define the html page to be reached
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/client/Site.html");
});

const httpServer = http.createServer(app);
httpServer.listen(8080, () => console.log("Listening on port 8080"));

//define the consts and variables
const clients = {};
//const games = {};
var colorsArray = ["black", "white"];
var clientsArray = [];
let numClients = 0;

//webSocket server
const wsServer = new websocket.server({
    httpServer: httpServer
});

wsServer.on("request", request => {

    //connect
    const connection = request.accept(null, request.origin);
    numClients++;

    connection.on("open", () => {
        console.log("opened!")
    })
    connection.on("close", () => {
        console.log("closed!");
        numClients--
        updatePlayerCount()
    })
    connection.on("message", message => {

        const result = JSON.parse(message.utf8Data)

        if (result.method === "create") {
            const clientId = result.clientId;

            /*const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "clients": []
            }*/

            const payLoad = {
                "method": "create"
                /*"gameId": gameId,
                "game" : games[gameId]*/
            }

            if(numClients >= 3) {
                const con = clients[clientId].connection;
                con.send(JSON.stringify({
                    "redirect": "teszt.html"
                }));
                return;
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //a client select color
        if (result.method === "selectColor") {

            const clientId = result.clientId;
            //const gameId = result.gameId;
            const chosenColor = result.color;
            numClients = Object.keys(clients).length;

                //if we would open a new game for the third client then it should be the %2==1
                if(numClients % 2 == 1 || clientsArray[numClients-2] == clientId){
                    
                    colorsArray = ["black", "white"];
                    clients[clientId].color = chosenColor;
                    colorsArray = colorsArray.filter(colorsArray => colorsArray !== chosenColor);

                }if(numClients % 2 == 0 && colorsArray.length == 2){
                    const con = clients[clientId].connection;
                    con.send(JSON.stringify({
                        "message": "wait",
                        "clientId": clientId
                    }));    
                }
                if(numClients % 2 == 0 && !(colorsArray.length == 2)){

                    clients[clientId].color = colorsArray[0];

                }

                const con = clients[clientId].connection;
                con.send(JSON.stringify({
                    "clientId": clientId,
                    "color": clients[clientId].color
                }));
        
        }

        //if first player have chosen a color

        if(result.method === "firstPlayerChose"){
            const otherClientId = result.clientId

            for (const clientId in clients) {
                if (clients.hasOwnProperty(clientId) && otherClientId !== clientId) {
                    const con = clients[clientId].connection;
                    con.send(JSON.stringify({
                        "clientId": clientId,
                        "color": colorsArray[0],
                    }));
                    chooseColor = colorsArray[0]
                }
            }

        }

        //a player moved an element
        if(result.method === "move"){
            const clientId = result.clientId;
            const tileId = result.tileId;
            const color = result.color

            broadcastMove(clientId, tileId, color);
        }

    })

    //generate a new clientId
    const clientId = guid();
    clientsArray.push(clientId);
    clients[clientId] = {
        "connection":  connection,
        "color": null
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId,
        "numberOfClients": numClients
    }

    //send back the client connect
    connection.send(JSON.stringify(payLoad));
    updatePlayerCount();

})

//update the number of clients
function updatePlayerCount() {
    for (const clientId in clients) {
        if (clients.hasOwnProperty(clientId)) {
            const con = clients[clientId].connection;
            con.send(JSON.stringify({
                "numberOfClients": numClients
            }));
        }
    }
}

//send the move to the clients
function broadcastMove(clientId, tileId, chooseColor) {

    for (const otherClientId in clients) {
        if (clients.hasOwnProperty(otherClientId) && otherClientId !== clientId) {
            const con = clients[otherClientId].connection;
            con.send(JSON.stringify({
                "method": "move",
                "clientId": clientId,
                "tileId": tileId,
                "color": chooseColor,
            }));
        }
    }
}

//random functions to generate ids
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();

//CHAT JAVASCIRPT!!!

const server2 = app.listen(4000, () => console.log("Szerver nyílt. Port: " + 4000))
const io = require('socket.io')(server2);

app.use(express.static(path.join(__dirname, 'client')));

let socketsConected = new Set();

io.on('connection', onConnected);

function onConnected(socket) {
  console.log("Kliens csatlakozott. ID: " + socket.id);
  socketsConected.add(socket.id);

  
  io.emit('clients-total', socketsConected.size);

  socket.on('disconnect', () => {
    console.log("Kliens lecsatlakozott. ID: " + socket.id);
    socketsConected.delete(socket.id);


    io.emit('clients-total', socketsConected.size);
  });

  socket.on('message', (data) => {
    socket.broadcast.emit('chat-message', data);
  });
}

