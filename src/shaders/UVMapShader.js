import Utils from '../Utils'
import UVMapShaderFrag from './UVMapShader.fs.glsl'
import UVMapShaderVert from './UVMapShader.vs.glsl'


var UVMapShader = {

    uniforms: {
    },

    vertexShader: UVMapShaderVert,

    fragmentShader: UVMapShaderFrag

};

export default UVMapShader
