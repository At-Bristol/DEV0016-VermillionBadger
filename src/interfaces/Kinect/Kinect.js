
var Kinect = function(){

  console.log('yo');
  //intial props
  this.decayRate = 100;
  this.coords = 'false';

  var _prevAccel = [];
  var _decay = [];
  var _socket = false;
  var _coords = [];
  var _isRecievingData = false

  init = function() {
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
      _coords = JSON.parse(e.data);
    };
  };

  _socket.onerror = function(e) {
    console.log('Kinect Client not connected at ', _socket.url, ' Is server turned on? npm run server')
  };

  this.getCoords = function() {
    return _coords;
  };

  this.update = function(decayRate) {

    var _rawcoords = this.getCoords();

    //map array from 6 inputs to 4
    var _numberOfInputs = 4;
    var _routing = _RouteArray(_rawcoords, _numberOfInputs);

    for (var i = 0; i < _numberOfInputs; i++) {
      if (!_rawcoords[_routing[i]]) {
        _coords[i] = false;
      } else {
        _coords[i] = _rawcoords[_routing[i]]
      };
    };

    if (!decayRate) {
      decayRate = 0;
    };

    for (var i = 0; i < _coords.length; i++) {
      if (_coords[i]) {
        _raycaster.setFromCamera(_coords[i], _camera);

        // from target point to camera
        var pos = _controls.target;
        var nor = pos.clone().sub(_camera.position).normalize();
        var plane = new THREE.Plane(
          nor, -nor.x * pos.x - nor.y * pos.y - nor.z * pos.z
        );

        var accel = new THREE.Vector3(_coords[i].x, _coords[i].y, _coords[i].z).length();

        var acceldif = Math.abs(_prevAccel[i] - accel);

        if (acceldif < 0.01) {
          _decay[i] = _decay[i] - (decayRate / 10000);
          _decay[i] = Math.max(_decay, 0)
        } else {
          _decay[i] = 1.0;
        };

        _prevAccel[i] = accel;
      };
    };
    return _coords
  };
};

export default Kinect


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
