import { createShaderMaterial } from './ShaderPass'
import SimShader from './shaders/SimShader'
import ParticleShader from './shaders/ParticleShader'

var Params = {
    size:2048,
    simMat: createShaderMaterial(SimShader),
    drawMat: createShaderMaterial(ParticleShader),
    update: undefined,  // defined later in the file
    autoRotateSpeed: 4.0,
    cameraDistance: 25,
    partcleAlpha: 0.5,
    shapeAccel: 0.2,
    inputAccel: 1.9
};

export default Params
