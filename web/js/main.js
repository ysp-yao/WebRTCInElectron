'use strict';
/*
 * UI
 */
var CallButton = document.getElementById('Call');
CallButton.onclick = Call;
var ConnetToServerButton = document.getElementById('ConnetToServer');
ConnetToServerButton.onclick = ConnetToServer;
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

/*
 * globe variables
 */
var servers = null;
var is_offer = false;
var is_first_msg = true;

var constraints = {
  audio: false,
  /*
  video: {
      mandatory: {
          chromeMediaSource: 'desktop',
      }
  }*/
  video:true
};
var rtcsdk = new Rtcsdk(constraints);
var ws;
/*
var constraints = {
  audio: false,
  video: true
};
var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};
*/


function ConnetToServer() {
	var x=document.getElementById("ws_addr").value;
  ws = new WebSocket(x);
  ws.onmessage = function(evt) { 
    onMessage(evt); 
  }; 
  ws.onopen = function(evt) {
    onOpen(evt);
  };
}

function onOpen(evt) {
  ConnetToServerButton.disabled = true;
}

function onMessage(evt) {  
  if (is_first_msg) {
    is_first_msg = false;
    if (!is_offer)
      rtcsdk.CreateAnswer(servers, evt.data);
    else
      rtcsdk.SetRemoteSDP(evt.data);
  }
  else {
    rtcsdk.addIceCandidate(evt.data);
  }
}

function Call() {
  is_offer = true;
  CallButton.disabled = true;

  let offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  };
  rtcsdk.CreateOffer(servers, offerOptions);
}

function trace(text) {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}

