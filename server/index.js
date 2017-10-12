const { HLTV } = require('hltv');
const http = require('http');
const express = require('express');

let liveMatches = [];
let sockets = [];
let geted = false;
let timerId = 0;
let port = process.env.PORT || 3000;

let errHendler = err => console.log('Err', err);

let socketEmit = (sockets, event, data) => {
    if(!sockets.length) {
        console.log('No Users');
        return;
    }
    for(let socket of sockets) {
        socket.emit(event, data);
    };
};

let app = express();

let server = http.Server(app);

app.get("/", (req, res) => {
    res.end("Welcome on port log " + port + "\n\n" + JSON.stringify(liveMatches));
});

server.listen(port, function() {
    console.log("App is running on port " + port);
 });

let io = require('socket.io')(server);

io.sockets.on('connection', (socket) => {
    console.log('Connected');
    
    socket.on('disconnect', () => {
        sockets.splice(sockets.indexOf(socket), 1);
        console.log('Disconnected');
    });

    sockets.push(socket);

    if(geted) {
        socket.emit('sendMatches', liveMatches);
    }

});

let getMatches = list => {
    let arr = ((list) ? list : []);
    return HLTV.getMatches().then((res) => {
        for (let match of res) {
            if(match['live']) {
                arr.push(match);
            }
        };
        return arr;
    }).catch(errHendler);
};

let init = list => {
    
    getMatches(list).then(res => {
        list = res;
        geted = true;
        console.log('Default Matches', liveMatches);
        socketEmit(sockets, 'sendMatches', liveMatches);
    }).catch(errHendler);
    
};

init(liveMatches);

let loop = () => {
    timerId = setInterval(() => {
        
        if(!sockets.length) {
            console.log('No Users in loop');
        }

            getMatches().then((localMatches) => {

                    let newMatches = [];
                
                    let oldId = [];
                    for(let match of liveMatches) {
                        oldId.push(match.id);
                    };

                    for(let i = 0; i < localMatches.length; i++) {
                        if(oldId.indexOf(localMatches[i].id) == -1) {
                            console.log('New Match ', localMatches[i]);
                            newMatches.push(localMatches[i]);

                            if(i == (localMatches.length -1)) {
                                liveMatches = localMatches;
                                console.log("New Matches ARR ", newMatches);
                                console.log('Send New Matches ', liveMatches);
                                socketEmit(sockets, 'newMatches', {newMatches, liveMatches});
                            };

                        };
                    };

                if(localMatches.length < liveMatches.length) {
                    liveMatches = localMatches;
                    console.log('Update matches', liveMatches);

                    socketEmit(sockets, 'updateMatches', liveMatches);

                }
        
            }).catch((err) => console.log(err));
        
        }, 30000);
};

loop();