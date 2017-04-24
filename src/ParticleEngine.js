import { createShaderMaterial } from './ShaderPass'
import SimInitShader from './shaders/SimInitShader'
import UpdateLoop from './UpdateLoop'
import Mouse from './Mouse'
import RenderContext from './RenderContext'
import ParticleSimulation from './ParticleSimulation'
import LeapManager from './LeapManager'
import Utils from './Utils'
import Gravitywell from './Gravitywell'


var ParticleEngine = function(params) {

   var client = new WebSocket('ws://127.0.0.1:1234', 'echo-protocol');

    var _this = this;

    var _canvas, _stats;
    var _updateLoop;
    var _renderer, _camera, _scene;
    var _sim, _simMat, _initMat, _drawMat;
    var _mouse, _gravitywell;
    var _controls, _raycaster;
    var _leapMan;
    var _customUpdate;
    var _pauseSim = false;
    var _coords = '{"x":0, "y":0, "z":0}';


    // PARAMS

    params = params || {};
    var _interactionPoint = params.interactionPoint || 1;
    var _size  = params.size || 1024;
    var _simMat = params.simMat || createShaderMaterial(BasicSimShader);
    var _initMat = params.initMat || createShaderMaterial(SimInitShader);
    var _drawMat = params.drawMat || createShaderMaterial(BasicParticleShader);
    var _autoRotateSpeed = params.autoRotateSpeed || 1.5;
    var _cameraDistance = params.cameraDistance || 25;
    var _customUpdate = params.update;
    var _particleAlpha = params.particleAlpha;


    // EVENTS

    var _onWindowResize = function() {
        _renderer.setSize(window.innerWidth, window.innerHeight);
    };

    var _onFrameUpdate = function(dt, t) {
        _stats.begin();

        //_leapUpdate();

        _inputUpdate();

        if (!_controls.enabled) _controls.update();

        if(_customUpdate) _customUpdate(dt, t);

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

        _mouse = new Mouse(_canvas);
        _gravitywell = new Gravitywell();

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

        _camera.position.set(0,0,_cameraDistance);
        _controls = new THREE.OrbitControls(_camera, _canvas);
        _controls.rotateUp(Math.PI/6);
        _controls.autoRotate = true;
        _controls.autoRotateSpeed = _autoRotateSpeed;
        _controls.noPan = true;
        _controls.enabled = false;  // disable user input

        _raycaster = new THREE.Raycaster();

        var tmat = (new THREE.Matrix4()).compose(
            new THREE.Vector3(0.0, -3.0, -_camera.position.z),
            new THREE.Quaternion(),
            new THREE.Vector3(0.015,0.015,0.015));
        _leapMan = new LeapManager(_renderer.getRenderer(), _camera, tmat);
        _simMat.defines.MULTIPLE_INPUT = "";    // TODO_NOP: at least even hardcode numbers for this in shader
        _simMat.needsUpdate = true;

        var _debugBox = document.querySelector("#debug-box");
    };

    var _mouseUpdate = function() {
        _interactionPoint
        var ms = _mouse.getMouse(0);
        //raycast tp find gravity point
        var point = JSON.parse(_coords);
        var hand = point.w
        delete point.z;
        delete point.w;
        var s = 1.2;
        point.x = point.x * s;
        point.y = point.y * s;


        _raycaster.setFromCamera(point, _camera);
        // from target point to camera
        var pos = _controls.target;
        var nor = pos.clone().sub(_camera.position).normalize();
        var plane = new THREE.Plane(
            nor, -nor.x*pos.x - nor.y*pos.y - nor.z*pos.z
        );

        // intersect plane
        var points = _raycaster.ray.intersectPlane(plane);
        //point = _coords ? _coords : {x:0.0,y:0.0,z:0.0};

        if (ms.buttons[0] || (ms.buttons[2])) {

            //console.log(ms.coords)



            _simMat.uniforms.uInputPos.value[0].copy(points);

            _simMat.uniforms.uInputPosAccel.value.set(
               ms.buttons[0] ? 1.0 : -1.0,  0,  0,  0
            );

            //console.log(_simMat.uniforms.uInputPosAccel.value);
        }
        else {
          //console.log(point);
          _simMat.uniforms.uInputPos.value[0].copy(points);
          if (hand === 1){
            _simMat.uniforms.uInputPosAccel.value.set(-1.0,0,0,0);
          }else{
            _simMat.uniforms.uInputPosAccel.value.set(1.0,0,0,0);
          }
        }


        // _debugBox.innerHTML +=
        //     "<br>"+_simMat.uniforms.uInputPosAccel.value.x.toFixed(2)
        //     +" "+_simMat.uniforms.uInputPosAccel.value.y.toFixed(2)
        //     +" "+_simMat.uniforms.uInputPosAccel.value.z.toFixed(2)
        //     +" "+_simMat.uniforms.uInputPosAccel.value.w.toFixed(2);
    };

    var _leapUpdate = function() {
        var K_PULL = 1.0;   // in grabStrength
        var K_PUSH = 100.0; // in sphereRadius

        _leapMan.update();

        for (var i=0; i<_leapMan.activeHandCount; i++) {
            var inputIdx = 3-i; // iterate backwards on input, so mouse can interact at same time
            if (_leapMan.frame.hands[i].grabStrength === K_PULL) {
                _simMat.uniforms.uInputPos.value[inputIdx].copy(_leapMan.palmPositions[i]);
                _simMat.uniforms.uInputPosAccel.value.setComponent(inputIdx, 1.0);
            }
            else if (_leapMan.frame.hands[i].sphereRadius >= K_PUSH) {
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
        _simMat.uniforms.uInputPosAccel.value.set(0,0,0,0);
        if (!_controls.enabled) _mouseUpdate();
        _leapUpdate();
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

    this.changeInteractionPoint = function(value){11
        console.log(_interactionPoint);
        _interactionPoint = value;
    };


    client.onopen = function(e){
      console.log('WebSocket Client Connected');

          function sendNumber() {
              if (client.readyState === client.OPEN) {
                  var number = Math.round(Math.random() * 0xFFFFFF);
                  client.send(number.toString());
                  setTimeout(sendNumber, 1000);
              }
          }
          sendNumber();
      };

    client.onclose = function() {
        console.log('echo-protocol Client Closed');
    };

    client.onmessage = function(e) {
        if (typeof e.data === 'string') {
            _coords = e.data;
        }
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
