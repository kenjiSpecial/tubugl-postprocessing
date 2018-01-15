precision mediump float;

uniform sampler2D uTexture;
uniform vec2 uDirection;
uniform vec2 uWindow;
varying vec2 vUv;

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}

void main() {
  vec2 uv;
  uv = vec2(vUv.x, 1.0 - vUv.y);
        
  vec4 col = blur9(uTexture, uv, uWindow, uDirection);
  gl_FragColor = vec4(col.rgb, 1.0);
}