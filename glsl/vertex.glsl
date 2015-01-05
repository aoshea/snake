attribute vec4 a_position;

uniform mat4 u_matrix;

varying lowp vec4 v_colour;
varying lowp vec4 v_rcolour;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {

   // multiply the position by the matrix 
   gl_Position = u_matrix * a_position;
   
   v_rcolour = vec4( rand(a_position.xy), rand(a_position.xy), rand(a_position.xy), 0.9) * 0.5 + 0.5;
   
   v_colour = gl_Position * 0.5 + 0.5;
   
}