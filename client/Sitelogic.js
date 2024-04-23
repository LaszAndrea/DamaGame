// data from server
var data = null;

//clientId from server
var clientId = null;
var numOfClients = null;
var colorChosen = null;
var firstPlayer = false;
var thirdPlayerTriedToConnect = false;

// WebSocket kapcsolat létrehozása a szerverrel
const ws = new WebSocket('ws://localhost:8080');

// Kapcsolat létrejöttekor
ws.onopen = function() {
  console.log('Connected to server');
};

// Üzenet érkezésekor
let redirectSent = false;

ws.onmessage = function(event) {
  
  data = JSON.parse(event.data)
  console.log(data)

  if(data.hasOwnProperty("message")){
    if(data.message === "wait" && data.clientId == clientId){
        var waitSide = document.querySelector('.waitSide');
        waitSide.style.display = 'flex';
    }else{
        var waitSide = document.querySelector('.waitSide');
        waitSide.style.display = 'none';
    }
  }

  checkIfClientId(data);

  if(numOfClients % 2 == 1){
    var waitSide = document.querySelector('.waitSide');
    waitSide.style.display = 'none';
  }

  checkIfColor(data);
  handleMove(data);

  if(data.hasOwnProperty("redirect") && !redirectSent) {
    window.location.href = data.redirect;
    // Átállítjuk a változót, hogy ne küldjük újra az átirányítást
    redirectSent = true;
    return; // Kilépünk a függvényből, hogy ne folytassuk a többi feldolgozást
}

};

// Hiba esetén
ws.onerror = function(event) {
  console.error('Error: ' + event);
};

// Kapcsolat bezárása esetén
ws.onclose = function() {
  console.log('Connection closed');
};

// Üzenet küldése a szervernek
function sendMessage(message) {
  ws.send(message);
}

// megnézzük hogy a clientId kaptuk e meg, illetve hogy hányan csatlakoztak eddig
var db = 0;
function checkIfClientId(data){
    if (data.hasOwnProperty('clientId') && clientId === null) {

        clientId = data.clientId;
        sendMessage(JSON.stringify({ method: "create", clientId: clientId}));

    }if(data.hasOwnProperty('numberOfClients')){

        numOfClients = data.numberOfClients;
        document.getElementById("numOfPlayers").innerHTML = "Csatlakozott játékosok: " + numOfClients + "/2";
        db++;

        if(db % 3 == 0){
            firstPlayer = true;
        }

        if(numOfClients>1 && colorChosen == null && !firstPlayer){
            var chooseSide = document.querySelector('.chooseSide');
            chooseSide.style.display = 'none';
        }

        if(numOfClients > 2){
            thirdPlayerTriedToConnect = true;
        }

    }
}

function checkIfColor(data){

    if(data.hasOwnProperty("color") && (colorChosen === null || colorChosen === undefined)){
        colorChosen = data.color
        document.getElementById("chosenColor").innerHTML = "Válaszott szín: " + colorChosen;
    }else if(firstPlayer && !(colorChosen === null || colorChosen === undefined) && !(numOfClients > 2) && !thirdPlayerTriedToConnect){
        sendMessage(JSON.stringify({ method: "firstPlayerChose", clientId: clientId, color: data.color }));
    }else
        return null
        
    if(!firstPlayer && !(colorChosen === null || colorChosen === undefined)){
        var chooseSide = document.querySelector('.waitSide');
        chooseSide.style.display = 'none';
    }
    

}

// Színválasztás kezelése a kliensen
var whiteplayerturn = false;

function chooseColor(color) {

    colorChosen = color;
    document.getElementById("chosenColor").innerHTML = "Válaszott szín: " + colorChosen;
    sendMessage(JSON.stringify({ method: "selectColor", clientId: clientId, color: color }));
    
    // Tüntessük el a választó felületet
    var chooseSide = document.querySelector('.chooseSide');
    chooseSide.style.display = 'none';
    var chooseSide = document.querySelector('.waitSide');
    chooseSide.style.display = 'none';

}

// Lépés kezelése
function handleMove(data) {

    if (data.method === "move") {
        const movingClient = data.clientId;
        const tileId = data.tileId;
        const color = data.color;

        if (clientId !== movingClient && color != colorChosen) {
            press(tileId)
        } else {
            console.log("It's my turn, I won't call press function");
        }

    }
}

var blacktiles = 12;
var whitetiles = 12;
var mandatoryHit = false;

var activeTile = "none";

const tileIDs = 
[
"11", "13", "15", "17", 
"22", "24", "26", "28",
"31", "33", "35", "37", 
"42", "44", "46", "48",
"51", "53", "55", "57", 
"62", "64", "66", "68",
"71", "73", "75", "77", 
"82", "84", "86", "88",
];

function checkIfPress(tileId){

    if((whiteplayerturn && colorChosen == "white") || (!whiteplayerturn && colorChosen == "black")){
        press(tileId)
    }

}

function chekForQueens(){
    let queenFound = false;
    for (let i=0; i<4;i++){
        if (document.getElementById(tileIDs[i]).src.endsWith("/Btile.png") ||
        document.getElementById(tileIDs[i]).src.endsWith("/Bselect.png") ) {
            document.getElementById(tileIDs[i]).src="imageref/BQtile.png";
            queenFound = true;
        }
    }
    for (let i=28; i<32;i++){
        if (document.getElementById(tileIDs[i]).src.endsWith("/Wtile.png") ||
        document.getElementById(tileIDs[i]).src.endsWith("/Wselect.png") ) {
            document.getElementById(tileIDs[i]).src="imageref/WQtile.png";
            queenFound = true;
        }
    }
    return queenFound;
}

function checkForWinner(){
    
}

function press(a) { 

    console.log("\nTurn:")
      
    selectTile(a);    
    
    refreshDisplayData();        
    callShowMandatoryHit();

}

function selectTile(a){    

        //if clicked on empty red tile
        if (document.getElementById(a).src.endsWith("/red.png") && !mandatoryHit){
            console.log("clicked on empty red tile")
            //todo for queens
            deselectActiveTile(activeTile); 
            activeTile = "none";       
        }

        //if clicked on occupied tile
        if (matchTileAndPlayer(a) && !mandatoryHit){
            console.log("clicked on occupied tile")
            //todo for queens
            deselectActiveTile(activeTile);
            selectActiveTile(a);
            callDestinationDetection();
            if((colorChosen === "black" && !whiteplayerturn) || (colorChosen === "white" && whiteplayerturn))
                sendMessage(JSON.stringify({ method: "move", clientId: clientId, tileId: a, color: colorChosen}));
        }

        //jump to empty possible tile
        if (document.getElementById(a).src.endsWith("/bred.png")) {        
            console.log("clicked on empty possible tile")
            hopOver(a);
            chekForQueens()
            if((colorChosen === "black" && !whiteplayerturn) || (colorChosen === "white" && whiteplayerturn))
                sendMessage(JSON.stringify({ method: "move", clientId: clientId, tileId: a, color: colorChosen}));
            switchTurn();
        }

        //select from mandatory options
        if (document.getElementById(a).src.endsWith("MWselect.png") || document.getElementById(a).src.endsWith("MWQselect.png") 
            || document.getElementById(a).src.endsWith("MBselect.png") || document.getElementById(a).src.endsWith("MBQselect.png")) { 
            console.log("select from mandatory options")
            grayToRed();
            changeMandatoryBack();
            selectActiveTile(a);
            callMandatoryDetection();    
            if((colorChosen === "black" && !whiteplayerturn) || (colorChosen === "white" && whiteplayerturn))
                sendMessage(JSON.stringify({ method: "move", clientId: clientId, tileId: a, color: colorChosen}));
        }

        //jump over other tile
        if (document.getElementById(a).src.endsWith("/rred.png") && activeTile!="none") {
            console.log("clicked on other tile")
            hitTile(a);
            callShowMandatoryHit()
            sendMessage(JSON.stringify({ method: "move", clientId: clientId, tileId: a, color: colorChosen }));
            if (chekForQueens() || !mandatoryHit) {
                switchTurn();
            }
        }        
    
}

function grayToRed(){
    for (let i = 0; i < tileIDs.length; i++) { 
        if (document.getElementById(tileIDs[i]).src.endsWith("gred.png")) {
            document.getElementById(tileIDs[i]).src="imageref/rred.png";
        }
    }
}

function callMandatoryDetection(){
    if (document.getElementById(activeTile).src.endsWith("WQselect.png") || document.getElementById(activeTile).src.endsWith("BQselect.png")) {
        console.log("QUEEN - MANDA");
        showPossibleMandatory(-1)
        showPossibleMandatory(1)
    } else if (document.getElementById(activeTile).src.endsWith("Wselect.png")) {
        showPossibleMandatory(1)
    }
    else if (document.getElementById(activeTile).src.endsWith("Bselect.png")) {
        showPossibleMandatory(-1)
    }
}

function showPossibleMandatory(upOrDown){    
    var jumpLeft = (Number(activeTile[0])+upOrDown*2).toString() + ((Number(activeTile[1])-2).toString());
    var jumpRight = (Number(activeTile[0])+upOrDown*2).toString() + ((Number(activeTile[1])+2).toString());

    for (let i = 0; i < tileIDs.length; i++) { 
        if (document.getElementById(tileIDs[i]).src.endsWith("rred.png") && tileIDs[i]!=jumpLeft && tileIDs[i]!=jumpRight) {
            document.getElementById(tileIDs[i]).src="imageref/gred.png";
        }
    }
}

function changeMandatoryBack(){
    for (let i = 0; i < tileIDs.length; i++) { 
        if (document.getElementById(tileIDs[i]).src.endsWith("Wselect.png")) {
            document.getElementById((tileIDs[i])).src="imageref/MWselect.png";
        } else if (document.getElementById(tileIDs[i]).src.endsWith("WQselect.png")) {
            document.getElementById((tileIDs[i])).src="imageref/MWQselect.png";
        } else if (document.getElementById(tileIDs[i]).src.endsWith("Bselect.png")) {
            document.getElementById((tileIDs[i])).src="imageref/MBselect.png";
        } else if (document.getElementById(tileIDs[i]).src.endsWith("BQselect.png")) {
            document.getElementById((tileIDs[i])).src="imageref/MBQselect.png";
        } 
    }
}

function showMandatoryHit(tileID, upOrDown){
    leftNeighbour = (Number(tileID[0])+upOrDown).toString() + ((Number(tileID[1])-1).toString());
    rightNeighbour = (Number(tileID[0])+upOrDown).toString() + ((Number(tileID[1])+1).toString());
    jumpLeft = (Number(tileID[0])+upOrDown*2).toString() + ((Number(tileID[1])-2).toString());
    jumpRight = (Number(tileID[0])+upOrDown*2).toString() + ((Number(tileID[1])+2).toString());           

    if (leftNeighbour[1] > 1 && leftNeighbour[0] > 1 && leftNeighbour[0] < 8 && isOccupiedByOpponent(leftNeighbour)) {                
        if (document.getElementById(jumpLeft).src.endsWith("red.png") || document.getElementById(jumpLeft).src.endsWith("bred.png") || document.getElementById(jumpLeft).src.endsWith("rred.png")) {
            document.getElementById((jumpLeft)).src="imageref/rred.png";
            selectActiveMandatoryTile(tileID);
            mandatoryHit = true;
        }
    }
    if (rightNeighbour[1] < 8 && rightNeighbour[0] > 1 && rightNeighbour[0] < 8 && isOccupiedByOpponent(rightNeighbour)) {
        if (document.getElementById(jumpRight).src.endsWith("red.png") || document.getElementById(jumpRight).src.endsWith("bred.png") || document.getElementById(jumpRight).src.endsWith("rred.png")) {                    
            document.getElementById((jumpRight)).src="imageref/rred.png";
            selectActiveMandatoryTile(tileID);
            mandatoryHit = true;
        }
    }
}

function callShowMandatoryHitOnOther(otherClientId){

    console.log("callShowMandatoryHit!!")

    mandatoryHit = false;
    for (let i = 0; i < tileIDs.length; i++) { 
        if (clientId != otherClientId 
        && (document.getElementById(tileIDs[i]).src.endsWith("Wselect.png") || document.getElementById(tileIDs[i]).src.endsWith("Wtile.png"))) {
            showMandatoryHit(tileIDs[i], 1)
        }
        else if (clientId != otherClientId
        && (document.getElementById(tileIDs[i]).src.endsWith("Bselect.png") || document.getElementById(tileIDs[i]).src.endsWith("Btile.png"))) {
            showMandatoryHit(tileIDs[i], -1)
        } else if (clientId != otherClientId
        && (document.getElementById(tileIDs[i]).src.endsWith("BQselect.png") || document.getElementById(tileIDs[i]).src.endsWith("BQtile.png")
        || document.getElementById(tileIDs[i]).src.endsWith("WQselect.png") || document.getElementById(tileIDs[i]).src.endsWith("WQtile.png"))) {
            showMandatoryHit(tileIDs[i], 1)
            showMandatoryHit(tileIDs[i], -1)
        }
    }

}

function callShowMandatoryHit(){

    //probléma az az, hogy a matchTileAndPlayer itt nem lesz igaz megint, mivel másik kliensnél nézzük

    mandatoryHit = false;
    for (let i = 0; i < tileIDs.length; i++) { 
        if (matchTileAndPlayer(tileIDs[i]) 
        && (document.getElementById(tileIDs[i]).src.endsWith("Wselect.png") || document.getElementById(tileIDs[i]).src.endsWith("Wtile.png"))) {
            showMandatoryHit(tileIDs[i], 1)
        }
        else if (matchTileAndPlayer(tileIDs[i]) 
        && (document.getElementById(tileIDs[i]).src.endsWith("Bselect.png") || document.getElementById(tileIDs[i]).src.endsWith("Btile.png"))) {
            showMandatoryHit(tileIDs[i], -1)
        } else if (matchTileAndPlayer(tileIDs[i]) 
        && (document.getElementById(tileIDs[i]).src.endsWith("BQselect.png") || document.getElementById(tileIDs[i]).src.endsWith("BQtile.png")
        || document.getElementById(tileIDs[i]).src.endsWith("WQselect.png") || document.getElementById(tileIDs[i]).src.endsWith("WQtile.png"))) {
            showMandatoryHit(tileIDs[i], 1)
            showMandatoryHit(tileIDs[i], -1)
        }
    }
}

function hitTile(a) {
    enemyTile = 
        ((Number(activeTile[0])+Number(a[0]))/2).toString()+
        ((Number(activeTile[1])+Number(a[1]))/2).toString();

    if (whiteplayerturn) {
        blacktiles -= 1;
    } else {
        whitetiles -= 1;
    }

    document.getElementById((enemyTile)).src="imageref/red.png"

    hopOver(a);
    deselectAll();
}

function hopOver(destTile) {
    deselectActiveTile(activeTile);
    document.getElementById((destTile)).src=document.getElementById((activeTile)).src;
    document.getElementById((activeTile)).src="imageref/red.png";    
    activeTile = "none";
}

function callDestinationDetection(){
    if (document.getElementById(activeTile).src.endsWith("WQselect.png") || document.getElementById(activeTile).src.endsWith("BQselect.png")) {
        console.log("QUEEN");
        showDestination(-1)
        showDestination(1)
    } else if (document.getElementById(activeTile).src.endsWith("Wselect.png")) {
        showDestination(1)
    }
    else if (document.getElementById(activeTile).src.endsWith("Bselect.png")) {
        showDestination(-1)
    }
}

function showDestination(upOrDown){
    if ((Number(activeTile[0])+upOrDown)>0 && (Number(activeTile[0])+upOrDown)<9 && Number(activeTile[1]) > 1) {
        firstID = (Number(activeTile[0])+upOrDown).toString() + ((Number(activeTile[1])-1).toString()); 
        if (document.getElementById(firstID).src.endsWith("/red.png")) {
            document.getElementById((firstID)).src="imageref/bred.png";
        }         
    }

    if ((Number(activeTile[0])+upOrDown)>0 && (Number(activeTile[0])+upOrDown)<9 && Number(activeTile[1]) < 8) { 
        secondID = (Number(activeTile[0])+upOrDown).toString() + ((Number(activeTile[1])+1).toString());  
        if (document.getElementById(secondID).src.endsWith("/red.png")){
            document.getElementById((secondID)).src="imageref/bred.png";
        }
    }
}

function isOccupiedByFriend(destTile){
    if (((document.getElementById(destTile).src.endsWith("/Wtile.png") || document.getElementById(destTile).src.endsWith("/WQtile.png")) && whiteplayerturn) 
        || ((document.getElementById(destTile).src.endsWith("/Btile.png") || document.getElementById(destTile).src.endsWith("/BQtile.png")) && !whiteplayerturn))
    {
        return true;
    }
    return false;

}

function isOccupiedByOpponent(destTile){
    if (((document.getElementById(destTile).src.endsWith("/Wtile.png") || document.getElementById(destTile).src.endsWith("/WQtile.png")) && !whiteplayerturn) 
        || ((document.getElementById(destTile).src.endsWith("/Btile.png") || document.getElementById(destTile).src.endsWith("/BQtile.png")) && whiteplayerturn))
    {
        return true;
    }
    return false;
}

function switchTurn(){

    if (whiteplayerturn ) {
        whiteplayerturn = false;
    } else {
        whiteplayerturn = true;
    }

}

function refreshDisplayData() {
    document.getElementById("numOfTiles").innerHTML = "W: " + whitetiles.toString() + " / B: " + blacktiles.toString();

    if (whiteplayerturn) {
        document.getElementById("currentPlayer").innerHTML = "Fehér kör";
    } else {
        document.getElementById("currentPlayer").innerHTML = "Fekete kör";
    }
}

function matchTileAndPlayer(a){
    if ((document.getElementById(a).src.endsWith("Wtile.png") || document.getElementById(a).src.endsWith("WQtile.png")
        || document.getElementById(a).src.endsWith("WQselect.png") || document.getElementById(a).src.endsWith("Wselect.png")) && whiteplayerturn  ){ // && colorChosen == "white"
        return true;
    } else if ((document.getElementById(a).src.endsWith("Btile.png") || document.getElementById(a).src.endsWith("BQtile.png")
    || document.getElementById(a).src.endsWith("BQselect.png") || document.getElementById(a).src.endsWith("Bselect.png")) && !whiteplayerturn ){ //   && colorChosen == "black"
        return true;
    }
    return false;
}

function selectActiveTile(a){    
    activeTile = a;
    if (document.getElementById(a).src.endsWith("Wtile.png") || document.getElementById(a).src.endsWith("MWselect.png")) {
        document.getElementById((a)).src="imageref/Wselect.png";
    } else if (document.getElementById(a).src.endsWith("WQtile.png") || document.getElementById(a).src.endsWith("MWQselect.png")) {
        document.getElementById((a)).src="imageref/WQselect.png";
    } else if (document.getElementById(a).src.endsWith("Btile.png") || document.getElementById(a).src.endsWith("MBselect.png")) {
        document.getElementById((a)).src="imageref/Bselect.png";
    } else if (document.getElementById(a).src.endsWith("BQtile.png") || document.getElementById(a).src.endsWith("MBQselect.png")) {
        document.getElementById((a)).src="imageref/BQselect.png";
    }
}

function selectActiveMandatoryTile(a){    
    if (document.getElementById(a).src.endsWith("Wtile.png")) {
        document.getElementById((a)).src="imageref/MWselect.png";
    } else if (document.getElementById(a).src.endsWith("WQtile.png")) {
        document.getElementById((a)).src="imageref/MWQselect.png";
    } else if (document.getElementById(a).src.endsWith("Btile.png")) {
        document.getElementById((a)).src="imageref/MBselect.png";
    } else if (document.getElementById(a).src.endsWith("BQtile.png")) {
        document.getElementById((a)).src="imageref/MBQselect.png";
    }
}

function deselectActiveTile(a){
    if (a!="none"){
        if (document.getElementById(a).src.endsWith("Wselect.png") || document.getElementById(a).src.endsWith("MWselect.png")) {
            document.getElementById((a)).src="imageref/Wtile.png";
        } else if (document.getElementById(a).src.endsWith("WQselect.png") || document.getElementById(a).src.endsWith("MWQselect.png")) {
            document.getElementById((a)).src="imageref/WQtile.png";
        } else if (document.getElementById(a).src.endsWith("Bselect.png") || document.getElementById(a).src.endsWith("MBselect.png")) {
            document.getElementById((a)).src="imageref/Btile.png";
        } else if (document.getElementById(a).src.endsWith("BQselect.png") || document.getElementById(a).src.endsWith("MBQselect.png")) {
            document.getElementById((a)).src="imageref/BQtile.png";
        }        

        //removes blue and red selected tiles too
        for (let i = 0; i < tileIDs.length; i++) { 
            if(document.getElementById(tileIDs[i]).src.endsWith("/bred.png") || document.getElementById(tileIDs[i]).src.endsWith("/rred.png") || document.getElementById(tileIDs[i]).src.endsWith("/gred.png")){
                document.getElementById(tileIDs[i]).src="imageref/red.png";
            }
        } 
    }
}

function deselectAll() {
    for (let i = 0; i < tileIDs.length; i++) { 
        deselectActiveTile(tileIDs[i]);
    }
}

// CHAT CLIENT JS - socket.js

document.addEventListener('DOMContentLoaded', function () {
    const socket = io();
    const clientsTotal = document.getElementById('client-total');
    const messageContainer = document.getElementById('message-container');
    const messageInput = document.getElementById('message-input');
  
    function chat() {
        const messageForm = document.getElementById('message-form');
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessageChat();
        })
  
        socket.on('clients-total', (data) => {
            clientsTotal.innerText = "Jelenleg " + data + " játékos van a chatszobában";
        })
    }
  
    function sendMessageChat() {
        if (messageInput.value === '') return
        const data = {
            message: messageInput.value,
        };
        socket.emit('message', data);
        showMessage(true, data);
        messageInput.value = '';
    }
  
    socket.on('chat-message', (data) => {
        showMessage(false, data);
    })
  
    function showMessage(isOwnMessage, data) {
        const element = `
        <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
            <p class="message">
                ${data.message}
            </p>
        </li>
        `;
        messageContainer.innerHTML += element;
        scrollToBottom();
    }
  
    function scrollToBottom() {
        messageContainer.scrollTo(0, messageContainer.scrollHeight);
    }
  
    chat(); ///after the dom loads we start the function
  });
  