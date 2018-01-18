precision mediump float;

uniform sampler2D uBlurTexture0;
uniform sampler2D uBlurTexture1;
uniform sampler2D uBlurTexture2;
uniform sampler2D uBlurTexture3;
uniform float uOverlay;

varying vec2 vUv;

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec3 bloomCol0 = texture2D(uBlurTexture0, uv).rgb;
  vec3 bloomCol1 = texture2D(uBlurTexture1, uv).rgb;
  vec3 bloomCol2 = texture2D(uBlurTexture2, uv).rgb;
  vec3 bloomCol3 = texture2D(uBlurTexture3, uv).rgb;
  
  gl_FragColor = vec4(bloomCol0 +  bloomCol1 /2.+ bloomCol2 /4.+ bloomCol3/8., 1.0);
  // gl_FragColor = vec4(bloomCol0 , 1.0);
}