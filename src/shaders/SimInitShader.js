import Utils from '../Utils'
import BasicVertex from './Basic.vs.glsl'
import BasicParticleVert from './BasicParticleShader.vs.glsl'
import BasicParticleFrag from './BasicParticleShader.fs.glsl'
import BasicSimShaderFrag from './BasicSimShader.fs.glsl'
import SimShaderFrag from './SimShader.fs.glsl'
import SimInitFrag from './SimInitShader.fs.glsl'

var SimInitShader = {

    uniforms: {
        "tDiffuse": { type: "t", value: null },
        "uColor": { type: "f", value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) }
    },

    vertexShader: BasicVertex,

    fragmentShader: SimInitFrag

};

export default SimInitShader
