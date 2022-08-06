toRoom = function(currentElement){
    var query = currentElement.srcUrl;
    chrome.tabs.create({url: "https://hayabuzo.me/tools/cloud/?img=" + query});  
};


chrome.contextMenus.removeAll(function() {
    chrome.contextMenus.create({
     id: "1",
     title: "View in cloudy.room",
     contexts:["image"],  
    }); })

chrome.contextMenus.onClicked.addListener(toRoom);
