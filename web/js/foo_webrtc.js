'use strict';



var pc = null;
var localStream;
var dataConstraint;
var sendChannel;

/* 
 * private
 */
function _get_stream(stream) {
    localVideo.srcObject = stream;
    window.localStream = localStream = stream;
}

function _get_remote_stream(e) {
    // Add remoteStream to global scope so it's accessible from the browser console
    trace("remote stream");
    window.remoteStream = remoteVideo.srcObject = e.stream;
}

function _onIceCandidate(pc, event) {
    if (event.candidate) {
      ws.send(event.candidate.candidate);
    }
}

function _onIceStateChange(pc, event) {
    if (pc) {
      trace(' ICE state: ' + pc.iceConnectionState);
    }
}

function _onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function _onSetLocalSuccess(pc) {
  trace('setLocalDescription complete');
}

function _onSetSessionDescriptionError(error) {
  trace('Failed to set session description: ' + error.toString());
}

function _onCreateOfferSuccess(desc) {
  trace(desc.sdp);
  if (ws)
    ws.send(desc.sdp);
  pc.setLocalDescription(desc).then(
    function() {
      _onSetLocalSuccess(pc);
    },
    _onSetSessionDescriptionError
  );
}

function _onSetRemoteSuccess(pc) {
    trace("_onSetRemoteSuccess");
}

function _onAddIceCandidateSuccess(pc) {
    trace("_onAddIceCandidateSuccess");
}

function _onCreateAnswerSuccess(desc) {
    trace(desc.sdp);
    if (ws)
      ws.send(desc.sdp);
    pc.setLocalDescription(desc).then(
      function() {
        _onSetLocalSuccess(pc);
      },
      _onSetSessionDescriptionError
    );
}

class Rtcsdk {
  
  constructor(constraints) {
    navigator.mediaDevices.getUserMedia(
        constraints
      )
      .then(_get_stream)
      .catch(function(e) {
        alert('getUserMedia() error: ' + e.name);
      });
  }

  CreateOffer(servers, offerOptions) {
    console.log("CreateOffer");

    window.pc = pc = new RTCPeerConnection(servers);
  
    //sendChannel = pc.createDataChannel('sendDataChannel', dataConstraint);
  
    //sendChannel.onopen = onSendChannelStateChange;
    //pc.onaddstream = _get_remote_stream;


    pc.onicecandidate = function(e) {
      _onIceCandidate(pc, e);
    };
  
    pc.oniceconnectionstatechange = function(e) {
      _onIceStateChange(pc, e);
    };
  
    pc.onaddstream = function(e) {
        trace("asdaad");
        window.remoteStream = remoteVideo.srcObject = e.stream;
    }

    pc.addStream(localStream);
  
    pc.createOffer(
    ).then(
      _onCreateOfferSuccess,
      _onCreateSessionDescriptionError
    );
  }

  CreateAnswer(servers, remote_sdp) {
    console.log("CreateAnswer");

    window.pc = pc = new RTCPeerConnection(servers);

    pc.onicecandidate = function(e) {
      _onIceCandidate(pc, e);
    };

    pc.oniceconnectionstatechange = function(e) {
      _onIceStateChange(pc, e);
    };
    pc.onaddstream = _get_remote_stream;

    pc.addStream(localStream);

    pc.setRemoteDescription(new RTCSessionDescription({type:"offer",sdp:remote_sdp})).then(
      function() {
        _onSetRemoteSuccess(pc);
      },
      _onSetSessionDescriptionError
    );

    pc.createAnswer().then(
      _onCreateAnswerSuccess,
      _onCreateSessionDescriptionError
    );
  }

  SetRemoteSDP(remote_sdp) {
    console.log("SetRemoteSDP");
 
    pc.setRemoteDescription({type:"answer",sdp:remote_sdp}).then(
        function() {
          _onSetRemoteSuccess(pc);
        },
        _onSetSessionDescriptionError
      );

   /*
   pc.setRemoteDescription({type:"answer",sdp:remote_sdp}, () => {
    console.log('setRemoteDescripton success!!!');
    pc.onaddstream = (event) => {
        window.remoteStream = remoteVideo.srcObject = event.stream;
    };
  }, (err) => {
    console.log(err);
  });
  */

  }

  addIceCandidate(remote_ice) {
    pc.addIceCandidate(
        new RTCIceCandidate({candidate: remote_ice})
      ).then(
        function() {
          _onAddIceCandidateSuccess(pc);
        },
        function(err) {
          _onAddIceCandidateError(pc, err);
        }
    );
  }
}