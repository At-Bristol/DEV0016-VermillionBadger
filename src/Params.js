import { createShaderMaterial } from './ShaderPass'
import SimShader from './shaders/SimShader'
import ParticleShader from './shaders/ParticleShader'

export var kinect = {
  maxUsers: 4,
  decayRate: 1000,
  decayThreshold: 0.01,
  range: 1.2
}

var Params = {
    size:2048,
    simMat: createShaderMaterial(SimShader),
    drawMat: createShaderMaterial(ParticleShader),
    update: undefined,  // defined later in the file
    autoRotateSpeed: 4.0,
    cameraDistance: 25,
    partcleAlpha: 0.5,
    shapeAccel: 0.2,
    inputAccel: 1.9,
    mouse: true,
    kinect: true,
};

export default Params
