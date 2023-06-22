// HTML elements
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// Variables
let localStream;
let remoteStream;
let localPeerConnection;
let remotePeerConnection;

// Functions
function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
}

function gotRemoteMediaStream(event) {
  const mediaStream = event.streams[0];
  remoteStream = mediaStream;
  remoteVideo.srcObject = mediaStream;
}

function handleConnection(event) {
  const peerConnection = event.target;
  const iceCandidate = event.candidate;

  if (iceCandidate) {
    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = getOtherPeer(peerConnection);

    otherPeer.addIceCandidate(newIceCandidate)
      .then(() => {
        handleConnectionSuccess(peerConnection);
      })
      .catch((error) => {
        handleConnectionFailure(peerConnection, error);
      });
  }
}

function handleConnectionSuccess(peerConnection) {
  console.log('Ice candidate connection success.');
}

function handleConnectionFailure(peerConnection, error) {
  console.log('Ice candidate connection failure: ', error);
}

function getOtherPeer(peerConnection) {
  return (peerConnection === localPeerConnection) ? remotePeerConnection : localPeerConnection;
}

function startCall() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  const servers = null;
  localPeerConnection = new RTCPeerConnection(servers);
  remotePeerConnection = new RTCPeerConnection(servers);

  localPeerConnection.addEventListener('icecandidate', handleConnection);
  remotePeerConnection.addEventListener('icecandidate', handleConnection);

  localPeerConnection.addEventListener('track', gotRemoteMediaStream);

  localStream.getTracks().forEach((track) => {
    localPeerConnection.addTrack(track, localStream);
  });

  localPeerConnection.createOffer()
    .then((offer) => {
      return localPeerConnection.setLocalDescription(offer);
    })
    .then(() => {
      return remotePeerConnection.setRemoteDescription(localPeerConnection.localDescription);
    })
    .then(() => {
      return remotePeerConnection.createAnswer();
    })
    .then((answer) => {
      return remotePeerConnection.setLocalDescription(answer);
    })
    .then(() => {
      return localPeerConnection.setRemoteDescription(remotePeerConnection.localDescription);
    })
    .catch((error) => {
      console.log('Error starting call: ', error);
    });
}

function hangupCall() {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  remoteVideo.srcObject = null;
}

// Event listeners
callButton.addEventListener('click', startCall);
hangupButton.addEventListener('click', hangupCall);
