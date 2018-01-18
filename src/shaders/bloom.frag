precision mediump float;

uniform sampler2D uMainTexture;
uniform sampler2D uBlurTexture;
uniform float uOverlay;

varying vec2 vUv;

float blendScreen(float base, float blend) {
	return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
	return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
	return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec4 bloomCol = texture2D(uBlurTexture, uv);
  vec4 baseCol = texture2D(uMainTexture, uv); 
  vec3 col = blendScreen(baseCol.rgb, bloomCol.rgb);
  
  if(baseCol.a == 0.0) discard;
  
  gl_FragColor = vec4(col.rgb, 1.0);
  // gl_FragColor = vec4(bloomCol.rgb, 1.0);
}