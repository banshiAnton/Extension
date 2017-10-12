
let liveMatches = angular.module('liveMatches', []);

liveMatches.controller('MyCtrl', ($scope) => {
    $scope.matchesList = chrome.extension.getBackgroundPage().matchesList;

    $scope.sound = chrome.extension.getBackgroundPage().soundPlay;

    $scope.hltvUrl = chrome.extension.getBackgroundPage().hltvUrl;

    $scope.hltvUrlMatches = $scope.hltvUrl + `matches/`;

    $scope.goMatch = chrome.extension.getBackgroundPage().goMatch;
    
    $scope.soundChange = () => {
        chrome.runtime.sendMessage({soundPlay: $scope.sound});
    };

});