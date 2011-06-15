var http = require('http');

var util = require('util');
var exec = require('child_process').exec;

var polls = new Array();
var server_messages = new Array();
var server_commands = new Array();

var init = 'No Initial State';
var noCurrentRequests = true;

//SENDING/RECEIVING REPONSES FROM THE SERVER
var message_command = 'curl -sL "http://magicjax/pong/input';
var init_command = 'curl -sL "http://magicjax/pong"';

http.createServer(function (req, res) {
    
    if(req.method == "POST") {
        var data = "";

        req.addListener("data", function(chunk) {
            data += chunk;
	});
 
	req.addListener("end", function() {
            addServerCommand(data);
	});
        
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('0');
    }
    else if(req.url == '/start') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(init);
    }
    else {
        polls.unshift(res);
    }
    
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');

//GET INITIAL SCREEN
getInitFromServer();

//FULFILLING CLIENT REQUESTS TO RENDER
setInterval(clientFulfillLoop, 50);
function clientFulfillLoop() {
    
    while(server_messages.length > 0) {
        var mess = server_messages.pop();
        while(polls.length > 0) {
            var poll = polls.pop();
            poll.writeHead(200, {'Content-Type': 'text/plain'});
            poll.end(mess);
        }
    }
    
}

setInterval(logStatus, 1000);
function logStatus() {
    console.log("REQ: " + polls.length + " MES: " + server_messages.length + " COM: " + server_commands.length);
}

function addServerCommand(command) {
    server_commands.unshift(command);
    serverFulfillQueue();
}

//FULFILLING SERVER REQUESTS TO EXECUTE
function serverFulfillQueue() {
    if(server_commands.length > 0 && noCurrentRequests) {
        noCurrentRequests = false;
        sendArrayToServer(server_commands.pop());
    }
}



function getInitFromServer() {
    exec(init_command, function(error, stdout, stderr){
        if(error != null) {
            console.log("SERVER ERROR: " + error);
        }
        else {
            receiveInitResponse(stdout);
        }
    });
}

function sendArrayToServer(cmd) {
    
    var query_string = message_command;
    query_string += "?" + cmd + '"';

    exec(query_string, function(error, stdout, stderr){
        noCurrentRequests = true;
        if(error != null) {
            console.log("SERVER ERROR: " + error);
        }
        else {
            receiveServerResponse(stdout);
        }
    });
}

function receiveServerResponse(response) {
    server_messages.push(response);
    serverFulfillQueue();
}

function receiveInitResponse(response) {
    init = response;
}