precision mediump float;
varying vec3 vNormal;
varying vec2 vUv;
uniform vec3 uColor;
void main() {
    vec3 outColor = (vNormal + vec3(1.0, 1.0, 1.0))/2.0;
     outColor = uColor;
    
    if(!gl_FrontFacing) outColor = vec3(1.0);
    
    // gl_FragColor = vec4( vec3(vUv, 0.0), 1.0);
    gl_FragColor = vec4(outColor, 1.0);
}