precision mediump float;

varying lowp vec4 v_rcolour;
varying lowp vec4 v_colour;

uniform float u_time; 

float nsin( float t, float offset ) {
  return sin(t + offset) * 0.25 + 0.25;
}

void main() {
   gl_FragColor = vec4( nsin(u_time, 0.0), nsin(u_time, 2.0), nsin(u_time, 4.0), 0.5 );
}