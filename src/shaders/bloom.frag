precision mediump float;

uniform sampler2D uMainTexture;
uniform sampler2D uBlurTexture;
uniform float uOverlay;

varying vec2 vUv;

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec3 bloomCol = texture2D(uBlurTexture, uv).rgb;
  float bloomGrayCol = (bloomCol.r + bloomCol.g + bloomCol.b)/3. ;
  vec4 col = texture2D(uMainTexture, uv) + vec4(bloomGrayCol) * uOverlay;
  
  gl_FragColor = vec4(col.rgb, 1.0);
}