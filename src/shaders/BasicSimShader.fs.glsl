varying vec2 vUv;

uniform sampler2D tPrev;
uniform sampler2D tCurr;
uniform float uDeltaT;
uniform float uTime;
uniform vec3 uInputPos[4];
uniform vec4 uInputPosAccel;

void main() {

    // read data
    vec3 prevPos = texture2D(tPrev, vUv).rgb;
    vec3 currPos = texture2D(tCurr, vUv).rgb;
    vec3 vel = (currPos - prevPos) / uDeltaT;

    // CALC ACCEL

    vec3 accel = vec3(0.0);

    // input pos
    {
    #define PROCESS_INPUT_POS(ACC, POS) if ((ACC) != 0.0) {
      vec3 toCenter = (POS)-currPos;
      float toCenterLength = length(toCenter);
      accel += (toCenter/toCenterLength) * (ACC)*uInputAccel/toCenterLength;
    }

    PROCESS_INPUT_POS(uInputPosAccel.x, uInputPos[0]);
    #ifdef MULTIPLE_INPUT
        PROCESS_INPUT_POS(uInputPosAccel.y, uInputPos[1]);
        PROCESS_INPUT_POS(uInputPosAccel.z, uInputPos[2]);
        PROCESS_INPUT_POS(uInputPosAccel.w, uInputPos[3]);
    #endif
    }

    // state updates
    vel = K_VEL_DECAY * vel + accel * uDeltaT;
    currPos += vel * uDeltaT;

    // write out
    gl_FragColor = vec4(currPos, 1.0);
}
