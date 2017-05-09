import { kinect } from './Params'

var _RouteArray = function(input, oLength) {
  var output = [];
  for (var i = 0; i < input.length; i++) {
    if (input[i]) {
      for (var a = 0; a < oLength; a++) {
        if (!output[a]) {
          output[a] = i;
          break;
        };
      };
    };
  };
  return output;
};

var KinectClient = function() {

  this.coords = 'false';
  this.range = kinect.range || 1;
  this.maxUsers = kinect.maxUsers || 1;
  this.decayRate = kinect.decayRate || 1000;
  this.decayThreshold = kinect.decayThreshold || 0.01;

  var _socket = false;
  var _rawCoords = [];
  var _coords = []
  var _isRecievingData = false
  var _prevAccel= [];
  var _decay = [];

  var init = function() {
    if (!_socket) {
      _socket = new WebSocket('ws://127.0.0.1:1234', 'echo-protocol');
    };
  };

  init();

  _socket.onopen = function(e) {
    console.log('Kinect Client connected at ', _socket.url);
  };

  _socket.onclose = function() {
    console.log('echo-protocol Client Closed');
  };

  _socket.onmessage = function(e) {
    if (!_isRecievingData) {
      _isRecievingData = true;
      console.log('Recieving kinect data from server');
    }
    if (typeof e.data === 'string') {
      _rawCoords = JSON.parse(e.data);
    };
  };

  _socket.onerror = function(e) {
    console.log('Kinect Client not connected at ', _socket.url, ' Is server turned on? npm run server')
  };

  this.getRawCoords = function() {
    return _rawCoords;
  };

  this.update = function() {

    var _rawcoords = this.getRawCoords();

    //map array from 6 inputs to 4

    var _routing = _RouteArray(_rawcoords, this.maxUsers);

    for (var i = 0; i < this.maxUsers; i++) {
      if (!_rawcoords[_routing[i]]) {
        _coords[i] = false;
      } else {
        _coords[i] = _rawcoords[_routing[i]]
      };
    };

    for (var i = 0; i < _coords.length; i++) {
      if (_coords[i]) {

        _coords[i].x *= this.range;
        _coords[i].y *= this.range;
        _coords[i].z *= this.range;

        var accel = new THREE.Vector3(_coords[i].x, _coords[i].y, _coords[i].z).length();

        var acceldif = Math.abs(_prevAccel[i] - accel);

        if (acceldif < 0.01) {
          _decay[i] = _decay[i] - (this.decayRate / 10000);
          _decay[i] = Math.max(_decay[i], 0)
        } else {
          _decay[i] = 1.0;
        };

        _coords[i].decay = _decay[i];
        _prevAccel[i] = accel;
      };
    };
    return _coords
  }.bind(this);

};

export default KinectClient
