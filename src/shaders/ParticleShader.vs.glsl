#define M_PI    3.14159265358979323846264338327950
#define M_2PI   6.28318530717958647692528676655900
#define M_PI2   1.57079632679489661923132169163975

#define EPS     0.0001

#define EQUALS(A,B) ( abs((A)-(B)) < EPS )
#define EQUALSZERO(A) ( ((A)<EPS) && ((A)>-EPS) )


#define PS_CAM_MAX_DIST 12.0

varying vec3 vColor;

uniform sampler2D tPos;
uniform float uTime;
uniform float uPointSize;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uColorFreq;
uniform float uColorSpeed;

float normaldist(float midpoint, float axis, float spread){
  float v = pow(spread,2.0);
  float e = -( pow(axis-midpoint,2.0)  / (2.0 * v) );
  float t = 1.0/( sqrt(2.0 * M_PI * v) );
  return pow(t,e);
}

void main() {
    float luma = (position.y+0.3)*1.0;
    vColor = vec3(normaldist(0.0,position.x,0.3)*luma,normaldist(0.5,position.x,0.18)*luma,normaldist(1.0,position.x,0.3)*luma);//mix(uColor1, uColor2, sin(uColorSpeed*uTime + uColorFreq*position.z*M_2PI)/2.0+0.5);

    vec4 posSample = texture2D(tPos, position.xy);
    vec3 pos = posSample.rgb;

    vec3 camToPos = pos - cameraPosition;
    float camDist = length(camToPos);

    gl_PointSize = max(1.0 * PS_CAM_MAX_DIST/camDist, 1.0)*(1.0/uPointSize);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
