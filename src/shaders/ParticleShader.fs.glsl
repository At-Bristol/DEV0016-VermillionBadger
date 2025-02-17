#define M_PI    3.14159265358979323846264338327950
#define M_2PI   6.28318530717958647692528676655900
#define M_PI2   1.57079632679489661923132169163975

#define EPS     0.0001

#define EQUALS(A,B) ( abs((A)-(B)) < EPS )
#define EQUALSZERO(A) ( ((A)<EPS) && ((A)>-EPS) )


varying vec3 vColor;

uniform float uTime;
uniform float uAlpha;

void main() {

    // calc alpha for shape
    vec2 tmpCoord = 0.5 * cos(M_2PI*gl_PointCoord+M_PI) + 1.0;
    float alpha = 1.0;//tmpCoord.x * tmpCoord.y;

    gl_FragColor = vec4(vColor, uAlpha*alpha);
}
