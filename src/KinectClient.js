var KinectClient = function() {

  this.coords = 'false';

  var _socket = false;
  var _coords = [];
  var _isRecievingData = false

  var init = function() {
    if (!_socket) {
      _socket = new WebSocket('ws://127.0.0.1:1234', 'echo-protocol');
    };
  };

  init();

  _socket.onopen = function(e) {
    console.log('Kinect Client connected at ',_socket.url);
  };

  _socket.onclose = function() {
    console.log('echo-protocol Client Closed');
  };

  _socket.onmessage = function(e) {
    if (!_isRecievingData){
      _isRecievingData = true;
      console.log('Recieving kinect data from server');
    }
    if (typeof e.data === 'string') {
      _coords = JSON.parse(e.data);
    };
  };

  _socket.onerror = function(e) {
    console.log('Kinect Client not connected at ',_socket.url,' Is server turned on? npm run server')
  };

  this.getCoords = function(){
    return _coords;
  };

};

export default KinectClient
