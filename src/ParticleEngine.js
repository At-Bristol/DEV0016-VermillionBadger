import {
  createShaderMaterial
} from './ShaderPass'
import SimInitShader from './shaders/SimInitShader'
import UpdateLoop from './UpdateLoop'
import Mouse from './Mouse'
import RenderContext from './RenderContext'
import ParticleSimulation from './ParticleSimulation'
import LeapManager from './LeapManager'
import Utils from './Utils'
import Kinect from './KinectClient'


var ParticleEngine = function(params) {

  var _this = this;
  var _canvas, _stats;
  var _updateLoop;
  var _renderer, _camera, _scene;
  var _sim, _simMat, _initMat, _drawMat;
  var _gravitywell;
  var _controls, _raycaster;
  var _leapMan;
  var _customUpdate;
  var _pauseSim = false;
  var _coords = [];
  var _prevAccel = new THREE.Vector3(0,0,0);
  var _scalar = 100;


  // PARAMS

  params = params || {};
  var _leap = params.leap || false;
  var _mouse = params.mouse || false;
  var _kinect = params.kinect || false;
  var _interactionPoint = params.interactionPoint || 1;
  var _size = params.size || 1024;
  var _simMat = params.simMat || createShaderMaterial(BasicSimShader);
  var _initMat = params.initMat || createShaderMaterial(SimInitShader);
  var _drawMat = params.drawMat || createShaderMaterial(BasicParticleShader);
  var _autoRotateSpeed = params.autoRotateSpeed || 1.5;
  var _cameraDistance = params.cameraDistance || 25;
  var _customUpdate = params.update;
  var _particleAlpha = params.particleAlpha;
//  var _prevAccel = [];
//  var _decay = [];
//  var _prevAccel = new THREE.Vector3(0,0,0);



  // EVENTS

  var _onWindowResize = function() {
    _renderer.setSize(window.innerWidth, window.innerHeight);
  };

  var _onFrameUpdate = function(dt, t) {
    _stats.begin();

    //_leapUpdate();

    _inputUpdate();

    if (!_controls.enabled) _controls.update();

    if (_customUpdate) _customUpdate(dt, t);

    _renderer.update(dt);
    //_leapMan.render();

    _stats.end();
  };

  var _onFixedUpdate = function(dt, t) {
    if (!_pauseSim) _sim.update(dt, t);
  };


  // PRIVATE FUNCTIONS

  var _init = function() {
    window.addEventListener("resize", _onWindowResize, false);

    _stats = new Stats();
    document.body.appendChild(_stats.domElement);

    _updateLoop = new UpdateLoop();
    _updateLoop.frameCallback = _onFrameUpdate;
    _updateLoop.fixedCallback = _onFixedUpdate;

    _canvas = document.querySelector("#webgl-canvas");

    if (_mouse) {
      _mouse = new Mouse(_canvas);
    }

    if (_kinect) {
      _kinect = new Kinect();
    }

    _renderer = new RenderContext(_canvas);
    _renderer.init();
    _camera = _renderer.getCamera();
    _scene = _renderer.getScene();
  };

  var _sceneInit = function() {
    _sim = new ParticleSimulation(_renderer.getRenderer(), _size, {
      simMat: _simMat,
      initMat: _initMat,
      drawMat: _drawMat
    });
    _scene.add(_sim.getParticleObject());

    _camera.position.set(0, 0, _cameraDistance);
    _controls = new THREE.OrbitControls(_camera, _canvas);
    _controls.rotateUp(Math.PI / 6);
    _controls.autoRotate = true;
    _controls.autoRotateSpeed = _autoRotateSpeed;
    _controls.noPan = true;
    _controls.enabled = false; // disable user input

    _raycaster = new THREE.Raycaster();

    var tmat = (new THREE.Matrix4()).compose(
      new THREE.Vector3(0.0, -3.0, -_camera.position.z),
      new THREE.Quaternion(),
      new THREE.Vector3(0.015, 0.015, 0.015));
    //_leapMan = new LeapManager(_renderer.getRenderer(), _camera, tmat);
    _simMat.defines.MULTIPLE_INPUT = ""; // TODO_NOP: at least even hardcode numbers for this in shader
    _simMat.needsUpdate = true;

    var _debugBox = document.querySelector("#debug-box");
  };

  var _mouseUpdate = function() {
    var mIdMax = Utils.isMobile ? 4 : 1;
    for (var mId = 0; mId < mIdMax; mId++) {
      var ms = _mouse.getMouse(mId);
      if (ms.buttons[0] || (mId === 0 && ms.buttons[2])) {
        _raycaster.setFromCamera(ms.coords, _camera);

        // from target point to camera
        var pos = _controls.target;
        var nor = pos.clone().sub(_camera.position).normalize();
        var plane = new THREE.Plane(
          nor, -nor.x * pos.x - nor.y * pos.y - nor.z * pos.z
        );

        // intersect plane
        var point = _raycaster.ray.intersectPlane(plane);


        _simMat.uniforms.uInputPos.value[mId].copy(point);
        _simMat.uniforms.uInputPosAccel.value.setComponent(mId, ms.buttons[0] ? 1.0 : -1.0);
      } else {
        _simMat.uniforms.uInputPosAccel.value.setComponent(mId, 0);
      }
    }
  };

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

  var _renderUpdate = function(coords) {

    for (var i = 0; i < coords.length; i++) {
      if (coords[i]) {
        _raycaster.setFromCamera(coords[i], _camera);

        // from target point to camera
        var pos = _controls.target;
        var nor = pos.clone().sub(_camera.position).normalize();
        var plane = new THREE.Plane(
          nor, -nor.x * pos.x - nor.y * pos.y - nor.z * pos.z
        );

        // intersect plane
        var point = _raycaster.ray.intersectPlane(plane);

        _simMat.uniforms.uInputPos.value[i].copy(point);
        _simMat.uniforms.uInputPosAccel.value.setComponent(i, coords[i].w ? -1.0 * coords[i].decay : 1.0 * coords[i].decay);

      };
    };
  };

  var _leapUpdate = function() {
    var K_PULL = 1.0; // in grabStrength
    var K_PUSH = 100.0; // in sphereRadius

    _leapMan.update();

    for (var i = 0; i < _leapMan.activeHandCount; i++) {
      var inputIdx = 3 - i; // iterate backwards on input, so mouse can interact at same time
      if (_leapMan.frame.hands[i].grabStrength === K_PULL) {
        _simMat.uniforms.uInputPos.value[inputIdx].copy(_leapMan.palmPositions[i]);
        _simMat.uniforms.uInputPosAccel.value.setComponent(inputIdx, 1.0);
      } else if (_leapMan.frame.hands[i].sphereRadius >= K_PUSH) {
        _simMat.uniforms.uInputPos.value[inputIdx].copy(_leapMan.palmPositions[i]);
        _simMat.uniforms.uInputPosAccel.value.setComponent(inputIdx, -1.0);
      }
    }

    // _debugBox.innerHTML =
    //     "hand1: " + (_leapMan.frame.hands[0] ? _leapMan.frame.hands[0].sphereRadius : "") + " " +
    //     "hand2: " + (_leapMan.frame.hands[1] ? _leapMan.frame.hands[1].sphereRadius : "") +
    //     "";
  };

  var _inputUpdate = function() {
    // reset input accels
    _simMat.uniforms.uInputPosAccel.value.set(0, 0, 0, 0);
    //if (!_controls.enabled) _mouseUpdate();
    if (_mouse) _mouseUpdate();
    if (_leap) _leapUpdate();
    if (_kinect) _renderUpdate(_kinect.update());
  };


  // PUBLIC FUNCTIONS

  this.start = function() {
    _updateLoop.start();
  };

  this.stop = function() {
    _updateLoop.stop();
  };

  this.pauseSimulation = function(value) {
    _pauseSim = value;
  };

  this.enableCameraAutoRotate = function(value) {
    _controls.autoRotate = value;
  };

  this.enableCameraControl = function(value) {
    _controls.enabled = value;
  };

  // INIT

  _init();

  _sceneInit();

  // expose variables
  this.renderer = _renderer;
  this.scene = _scene;
  this.camera = _camera;
};

export default ParticleEngine
