import Utils from '../Utils'
import BasicVertex from './Basic.vs.glsl'
import BasicParticleVert from './BasicParticleShader.vs.glsl'
import BasicParticleFrag from './BasicParticleShader.fs.glsl'
import ParticleVert from './ParticleShader.vs.glsl'
import ParticleFrag from './ParticleShader.fs.glsl'
import BasicSimShaderFrag from './BasicSimShader.fs.glsl'
import SimShaderFrag from './SimShader.fs.glsl'
import SimInitFrag from './SimInitShader.fs.glsl'


var ParticleShader = {

    uniforms: {
        "tPos": { type: "t", value: null },
        "uTime" : { type: "f", value: 0.0 },
        "uPointSize": { type: "f", value: 2.5 },
        "uAlpha": { type: "f", value: 0.2 },
        "uColor1": { type: "v3", value: new THREE.Vector3(1.0, 0.6, 0.1) },
        "uColor2": { type: "v3", value: new THREE.Vector3(1.0, 0.4, 1.0) },
        "uColorFreq": { type: "f", value: 1.0 },
        "uColorSpeed": { type: "f", value: 2.0 },
    },

    vertexShader: ParticleVert,

    fragmentShader: ParticleFrag

};

var BasicParticleShader = {

    defines: {
        "POINT_SIZE": Utils.isMobile ? "5.0" : "1.0",
    },

    uniforms: {
        "tPos": { type: "t", value: null },
        "uColor": { type: "v4", value: new THREE.Vector4(1.0, 0.6, 0.1, 0.2) },
    },

    vertexShader: BasicParticleVert,

    fragmentShader: BasicParticleFrag

};

export default ParticleShader
