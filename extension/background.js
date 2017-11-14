window.soundPlay = null;

let missed = {mis:null};

chrome.storage.sync.get('soundPlay', (item) => {
    soundPlay = ((Object.keys(item).length) ? item.soundPlay : true);
    if(missed.mis) {
        createNotofication(...missed.agrs);
    }
});

window.hltvUrl = `https://www.hltv.org/`;
window.matchesList = [];

let localUrl = 'http://localhost:3000'; 
let socketUrl = 'https://still-stream-81266.herokuapp.com/';

let audio = new Howl({
    urls:['solemn.mp3']
});

let defOptionsNotif = {
    type: 'basic',
    priority: 2,
    iconUrl: 'logo.png',
    title: 'HLTV Live Matches'
};

chrome.notifications.onClicked.addListener((notificationId) => {

    if(notificationId == 'openMsg') {
        goMatch(hltvUrl + `matches/`);

    } else {
        for(let match of matchesList) {
            if(match.id == +notificationId) {
                goMatch(null, match.id, match.team1.name, match.team2.name, match.event.name);
            }
        }
    }
    chrome.notifications.clear(notificationId)
});

chrome.runtime.onMessage.addListener((message) => {
    soundPlay = message.soundPlay;    
    chrome.storage.sync.set({soundPlay});
});

let socket = io.connect(localUrl);
socket.on('sendMatches', (data) => {

    let noOne = true;
    matchesList = data;

    if(matchesList.length == 1) {
        noOne = false;
    }

    createNotofication(defOptionsNotif, matchesList, noOne);

});

socket.on('newMatches', (data) => {
    matchesList = data.liveMatches;
    console.log('New Matches ', matchesList);
    createNotofication(defOptionsNotif, data.newMatches, false);
});

socket.on('updateMatches', (data) => {
    matchesList = data;
});

let createNotofication = (options, data, onLoad) => {

    if(soundPlay == null) {
        missed.mis = true;
        missed.agrs = [options, data, onLoad];
        return; 
    }
    
    if(soundPlay){
        audio.play();
    }

    if(onLoad) {
        options['message'] = ``;
        if(!data.length) {
            options['message'] = `No Matches Now`;
        } else {
            for(let match of data) {
                options['message'] += `${match.team1.name} vs ${match.team2.name}\n`;
            }
        }
        chrome.notifications.create('openMsg', options);
        return;
    }

    for(let match of data) {
            options['message'] = `${match.team1.name} vs ${match.team2.name}`;
            chrome.notifications.create(`${match['id']}`, options);
    };

};

window.goMatch = (url, id, ...arr) => {
    if(!url) {
        let reg = new RegExp(' ', 'ig');
        for(let i = 0; i < arr.length; i++) {
            arr[i] = arr[i].trim().toLowerCase();
            if(arr[i].search(reg) !== -1) {
                arr[i] = arr[i].replace(reg, '-');
            }
        };
        url = `https://www.hltv.org/matches/${id}/${arr[0]}-vs-${arr[1]}-${arr[2]}`;
    }

    chrome.windows.getAll({populate: true}, (arr) => {
        if(arr.length) {
            chrome.tabs.create({ url });
        } else {
            chrome.windows.create({url, state: "maximized"});
        }
    });
};
