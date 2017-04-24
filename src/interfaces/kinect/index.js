import WinJS from 'winjs'
import Windows from 'windows'

var kinect = function () {

  WinJS.Binding.optimizeBindingReferences = true;

  var _app = WinJS.Application;
  var _activation = Windows.ApplicationModel.Activation;
  var _streams = Windows.Storage.Streams;
  var _kinect = WindowsPreview.Kinect;

  // C++ WinRT component
  var bodyImageProcessor = KinectImageProcessor.BodyHelper;

  // active Kinect sensor
  var sensor = null;

  // reader for body frames
  var bodyFrameReader = null;

  // array of all bodies
  var bodies = null;

  // array of all bones in a body
  // bone defined by two joints
  var bones = null;

  // defines a different color for each body
  var bodyColors = null;

  // total number of joints = 25
  var jointCount = null;

  // total number of bones = 24
  var boneCount = null;

  // handstate circle size
  var HANDSIZE = 20;

  // tracked bone line thickness
  var TRACKEDBONETHICKNESS = 4;

  // inferred bone line thickness
  var INFERREDBONETHICKNESS = 1;

  // thickness of joints
  var JOINTTHICKNESS = 3;

  // thickness of clipped edges
  var CLIPBOUNDSTHICKNESS = 5;

  // closed hand state color
  var HANDCLOSEDCOLOR = "red";

  // open hand state color
  var HANDOPENCOLOR = "green";

  // lasso hand state color
  var HANDLASSOCOLOR = "blue";

  // tracked joint color
  var TRACKEDJOINTCOLOR = "green";

  // inferred joint color
  var INFERREDJOINTCOLOR = "yellow";

  // Handles the body frame data arriving from the sensor
  function reader_BodyFrameArrived(args) {
      // get body frame
      var bodyFrame = args.frameReference.acquireFrame();
      var dataReceived = false;

      if (bodyFrame != null) {
          // got a body, update body data
          bodyFrame.getAndRefreshBodyData(bodies);
          dataReceived = true;
          bodyFrame.close();
      }

      if (dataReceived) {
          // clear canvas before drawing each frame
          bodyContext.clearRect(0, 0, bodyCanvas.width, bodyCanvas.height);

          // iterate through each body
          for (var bodyIndex = 0; bodyIndex < bodies.length; ++bodyIndex) {
              var body = bodies[bodyIndex];

              // look for tracked bodies
              if (body.isTracked) {
                  // get joints collection
                  var joints = body.joints;
                  // allocate space for storing joint locations
                  var jointPoints = createJointPoints();

                  // call native component to map all joint locations to depth space
                  if (bodyImageProcessor.processJointLocations(joints, jointPoints)) {

                      // draw the body
                      drawBody(joints, jointPoints, bodyColors[bodyIndex]);

                      // draw handstate circles
                      updateHandState(body.handLeftState, jointPoints[_kinect.JointType.handLeft]);
                      updateHandState(body.handRightState, jointPoints[_kinect.JointType.handRight]);

                      // draw clipped edges if any
                      drawClippedEdges(body);
                  }
              }
          }
      }
  }


  // Checks if an edge is clipped
  var hasClippedEdges = function (edges, clippedEdge) {
      return ((edges & clippedEdge) != 0);
  }

  // Allocate space for joint locations
  var createJointPoints = function () {
      var jointPoints = new Array();

      for (var i = 0; i < jointCount; ++i) {
          jointPoints.push({ joint: 0, x: 0, y: 0 });
      }

      return jointPoints;
  }

  // Create array of bones
  var populateBones = function () {
      var bones = new Array();

      // torso
      bones.push({ jointStart: _kinect.JointType.head,             jointEnd: _kinect.JointType.neck });
      bones.push({ jointStart: _kinect.JointType.neck,             jointEnd: _kinect.JointType.spineShoulder });
      bones.push({ jointStart: _kinect.JointType.spineShoulder,    jointEnd: _kinect.JointType.spineMid });
      bones.push({ jointStart: _kinect.JointType.spineMid,         jointEnd: _kinect.JointType.spineBase });
      bones.push({ jointStart: _kinect.JointType.spineShoulder,    jointEnd: _kinect.JointType.shoulderRight });
      bones.push({ jointStart: _kinect.JointType.spineShoulder,    jointEnd: _kinect.JointType.shoulderLeft });
      bones.push({ jointStart: _kinect.JointType.spineBase,        jointEnd: _kinect.JointType.hipRight });
      bones.push({ jointStart: _kinect.JointType.spineBase,        jointEnd: _kinect.JointType.hipLeft });

      // right arm
      bones.push({ jointStart: _kinect.JointType.shoulderRight,    jointEnd: _kinect.JointType.elbowRight });
      bones.push({ jointStart: _kinect.JointType.elbowRight,       jointEnd: _kinect.JointType.wristRight });
      bones.push({ jointStart: _kinect.JointType.wristRight,       jointEnd: _kinect.JointType.handRight });
      bones.push({ jointStart: _kinect.JointType.handRight,        jointEnd: _kinect.JointType.handTipRight });
      bones.push({ jointStart: _kinect.JointType.wristRight,       jointEnd: _kinect.JointType.thumbRight });

      // left arm
      bones.push({ jointStart: _kinect.JointType.shoulderLeft,     jointEnd: _kinect.JointType.elbowLeft });
      bones.push({ jointStart: _kinect.JointType.elbowLeft,        jointEnd: _kinect.JointType.wristLeft });
      bones.push({ jointStart: _kinect.JointType.wristLeft,        jointEnd: _kinect.JointType.handLeft });
      bones.push({ jointStart: _kinect.JointType.handLeft,         jointEnd: _kinect.JointType.handTipLeft });
      bones.push({ jointStart: _kinect.JointType.wristLeft,        jointEnd: _kinect.JointType.thumbLeft });

      // right leg
      bones.push({ jointStart: _kinect.JointType.hipRight,         jointEnd: _kinect.JointType.kneeRight });
      bones.push({ jointStart: _kinect.JointType.kneeRight,        jointEnd: _kinect.JointType.ankleRight });
      bones.push({ jointStart: _kinect.JointType.ankleRight,       jointEnd: _kinect.JointType.footRight });

      // left leg
      bones.push({ jointStart: _kinect.JointType.hipLeft,          jointEnd: _kinect.JointType.kneeLeft });
      bones.push({ jointStart: _kinect.JointType.kneeLeft,         jointEnd: _kinect.JointType.ankleLeft });
      bones.push({ jointStart: _kinect.JointType.ankleLeft,        jointEnd: _kinect.JointType.footLeft });

      return bones;
  }

  // Handler for sensor availability changes
  function sensor_IsAvailableChanged(args) {
      if (sensor.isAvailable) {
          document.getElementById("statustext").innerHTML = "Running";
      }
      else {
          document.getElementById("statustext").innerHTML = "Kinect not available!";
      }
  }

  _app.onactivated = function (args) {
      if (args.detail.kind === _activation.ActivationKind.launch) {
          if (args.detail.previousExecutionState !== _activation.ApplicationExecutionState.terminated) {
              // get the kinectSensor object
              sensor = _kinect.KinectSensor.getDefault();

              // add handler for sensor availability
              sensor.addEventListener("isavailablechanged", sensor_IsAvailableChanged);

              // open the reader for frames
              bodyFrameReader = sensor.bodyFrameSource.openReader();

              // wire handler for frame arrival
              bodyFrameReader.addEventListener("framearrived", reader_BodyFrameArrived);

              // get depth frame description
              var depthFrameDescription = sensor.depthFrameSource.frameDescription;

              // create bodies array
              bodies = new Array(sensor.bodyFrameSource.bodyCount);

              // create bones
              bones = populateBones();

              // set number of joints and bones
              jointCount = _kinect.Body.jointCount;
              boneCount = bones.length;

              // get canvas objects
              bodyCanvas = document.getElementById("mainCanvas");
              bodyCanvas.width = depthFrameDescription.width;;
              bodyCanvas.height = depthFrameDescription.height;;
              bodyContext = bodyCanvas.getContext("2d");

              // set body colors for each unique body
              bodyColors = [
                  "red",
                  "orange",
                  "green",
                  "blue",
                  "indigo",
                  "violet"
              ];

              // open the sensor
              sensor.open();

          } else {
              // TODO: This application has been reactivated from suspension.
              // Restore application state here.
          }
          args.setPromise(WinJS.UI.processAll());
      }
  };

  _app.oncheckpoint = function (args) {
      // TODO: This application is about to be suspended. Save any state
      // that needs to persist across suspensions here. You might use the
      // WinJS.Application.sessionState object, which is automatically
      // saved and restored across suspension. If you need to complete an
      // asynchronous operation before your application is suspended, call
      // args.setPromise().
  };

  _app.onunload = function (args) {
      if (depthFrameReader != null) {
          depthFrameReader.close();
      }

      if (sensor != null) {
          sensor.close();
      }
  }
  _app.start();

  var _init = function(){

  }

}

export default kinect
