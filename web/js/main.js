'use strict';
var is_offer = false;
var is_first_msg = true;
var pc = null;
var localStream;
var dataConstraint;
var sendChannel;

var ws;
var CallButton = document.getElementById('Call');
CallButton.onclick = Call;
var ConnetToServerButton = document.getElementById('ConnetToServer');
ConnetToServerButton.onclick = ConnetToServer;
var localVideo = document.getElementById('localVideo');


var constraints = {
  audio: false,
  video: {
      mandatory: {
          chromeMediaSource: 'desktop',
      }
  }
};
var offerOptions = {
  offerToReceiveAudio: 0,
  offerToReceiveVideo: 0
};

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
    onMessage(evt) 
}; 
}

function onMessage(evt) {
  trace("======" + evt.data);

  if (is_offer == false) {
    if (is_first_msg) {
      is_first_msg = false;
  
      var servers = null;
      window.pc = pc = new RTCPeerConnection(servers);
  
      pc.onicecandidate = function(e) {
        onIceCandidate(pc, e);
      };
  
      pc.oniceconnectionstatechange = function(e) {
        onIceStateChange(pc, e);
      };
      pc.onaddstream = gotRemoteStream;
  
      pc.setRemoteDescription(new RTCSessionDescription({type:"offer",sdp:evt.data})).then(
        function() {
          onSetRemoteSuccess(pc);
        },
        onSetSessionDescriptionError
      );
  
      pc.createAnswer().then(
        onCreateAnswerSuccess,
        onCreateSessionDescriptionError
      );
    }
    else {
      pc.addIceCandidate(
        new RTCIceCandidate({candidate: evt.data})
      ).then(
        function() {
          onAddIceCandidateSuccess(pc);
        },
        function(err) {
          onAddIceCandidateError(pc, err);
        }
      );
    }
  }
  else {
    if (is_first_msg) {
      pc.setRemoteDescription({type:"answer",sdp:evt.data}).then(
        function() {
          onSetRemoteSuccess(pc);
        },
        onSetSessionDescriptionError
      );
    }
    else {
      pc.addIceCandidate(
        new RTCIceCandidate({candidate: evt.data})
      ).then(
        function() {
          onAddIceCandidateSuccess(pc);
        },
        function(err) {
          onAddIceCandidateError(pc, err);
        }
      );
    }
  }
}

function gotStream1(stream) {
  localVideo.srcObject = stream;
  window.localStream = localStream = stream;

  var servers = null;
  window.pc = pc = new RTCPeerConnection(servers);

  sendChannel = pc.createDataChannel('sendDataChannel', dataConstraint);
  
  pc.onicecandidate = function(e) {
    onIceCandidate(pc, e);
  };

  pc.oniceconnectionstatechange = function(e) {
    onIceStateChange(pc, e);
  };

  pc.addStream(localStream);

  pc.createOffer(
    offerOptions
  ).then(
    onCreateOfferSuccess,
    onCreateSessionDescriptionError
  );
}


function Call() {

  is_offer = true;
  CallButton.disabled = true;
  navigator.mediaDevices.getUserMedia(
    constraints
  )
  .then(gotStream1)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}

function onCreateOfferSuccess(desc) {
  if (ws)
    ws.send(desc.sdp);
  pc.setLocalDescription(desc).then(
    function() {
      onSetLocalSuccess(pc);
    },
    onSetSessionDescriptionError
  );
}

function onCreateAnswerSuccess(desc) {
  if (ws)
    ws.send(desc.sdp);
  pc.setLocalDescription(desc).then(
    function() {
      onSetLocalSuccess(pc);
    },
    onSetSessionDescriptionError
  );
}



function onIceCandidate(pc, event) {
  if (event.candidate) {
    ws.send(event.candidate.candidate);
  }
}

function CreateAnswer() {
  trace("CreateAnswer");
}


localVideo.addEventListener('loadedmetadata', function() {
  trace('Local video videoWidth: ' + this.videoWidth +
    'px,  videoHeight: ' + this.videoHeight + 'px');
});

remoteVideo.addEventListener('loadedmetadata', function() {
  trace('Remote video videoWidth: ' + this.videoWidth +
    'px,  videoHeight: ' + this.videoHeight + 'px');
});

remoteVideo.onresize = function() {

};

function getName(pc) {
  return 'pc';
}

function getOtherPc(pc) {
  return 'pc';
}


function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}




  

function onSetLocalSuccess(pc) {
  trace('setLocalDescription complete');
}

function onSetRemoteSuccess(pc) {
  trace(getName(pc) + ' setRemoteDescription complete');
}

function onSetSessionDescriptionError(error) {
  trace('Failed to set session description: ' + error.toString());
}

function gotRemoteStream(e) {
  // Add remoteStream to global scope so it's accessible from the browser console
  window.remoteStream = remoteVideo.srcObject = e.stream;
  trace('pc2 received remote stream');
}




function onAddIceCandidateSuccess(pc) {
  trace(getName(pc) + ' addIceCandidate success');
}

function onAddIceCandidateError(pc, error) {
  trace(getName(pc) + ' failed to add ICE Candidate: ' + error.toString());
}

function onIceStateChange(pc, event) {
  if (pc) {
    trace(getName(pc) + ' ICE state: ' + pc.iceConnectionState);
    console.log('ICE state change event: ', event);
  }
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
