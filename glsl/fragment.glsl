precision mediump float;

varying lowp vec4 v_colour;

void main() {
   gl_FragColor = vec4(v_colour.xyz, 0.85);
}