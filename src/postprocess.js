import { Program, IndexArrayBuffer, ArrayBuffer } from 'tubugl-core';
import { FrameBuffer } from 'tubugl-core/src/frameBuffer';
import {
	COLOR_BUFFER_BIT,
	DEPTH_BUFFER_BIT,
	TRIANGLES,
	UNSIGNED_SHORT,
	BLEND,
	CULL_FACE
} from 'tubugl-constants';

export class Postprocess {
	constructor(
		gl,
		params = { isEnableDepthBuffer: true },
		fragmentSrc,
		width = window.innerWidth,
		height = window.innerHeight
	) {
		if (!fragmentSrc)
			console.warn('[postprocess]: fragmentSrc is empty. prepare fragmentShader!');

		this._gl = gl;
		this._width = width;
		this._height = height;

		this._makeFramebuffer(params.isEnableDepthBuffer);
		this._makeProgram(fragmentSrc);
	}
	_makeFramebuffer(isEnableDepthBuffer) {
		this._framebuffer = new FrameBuffer(this._gl, {}, window.innerWidth, window.innerHeight);
		if (isEnableDepthBuffer) this._framebuffer.makeDepthBUffer();
		this._framebuffer.unbind();
	}
	_makeProgram(fragmentSrc) {
		const vertexSrc = `
        attribute vec4 position;
        attribute vec2 uv;
        
        uniform float uTheta;
        varying vec2 vUv;
        void main() {
            gl_Position = position;
        
            vUv = vec2(uv.x, 1.0 - uv.y); 
        }`;

		this._program = new Program(this._gl, vertexSrc, fragmentSrc);

		let positions = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
		let uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
		let indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

		this._positionBuffer = new ArrayBuffer(this._gl, positions);
		this._positionBuffer.setAttribs('position', 2);

		this._uvBuffer = new ArrayBuffer(this._gl, uvs);
		this._uvBuffer.setAttribs('uv', 2);

		this._indexBuffer = new IndexArrayBuffer(this._gl, indices);

		this._cnt = 6;
	}
	bind() {
		this._framebuffer.bind();
		return this;
	}
	unbind() {
		this._framebuffer.unbind();
		return this;
	}
	render(uniforms = []) {
		return this.update(uniforms).draw();
	}

	_updateAttributes() {
		this._indexBuffer.bind();
		this._positionBuffer.bind().attribPointer(this._program);
		this._uvBuffer.bind().attribPointer(this._program);
	}

	update(uniforms = []) {
		this._program.bind();

		this._updateAttributes();

		uniforms.forEach(uniform => {
			if (uniform) {
				let value = uniform.value;
				switch (uniform.type) {
					case 'float':
						this._gl.uniform1f(this._program.getUniforms(uniform.name).location, value);
						break;
					case 'vec2':
						this._gl.uniform2f(
							this._program.getUniforms(uniform.name).location,
							value[0],
							value[1]
						);
						break;
					case 'vec3':
						this._gl.uniform3f(
							this._program.getUniforms(uniform.name).location,
							value[0],
							value[1],
							value[2]
						);
						break;
					case 'texture':
						this.program.setUniformTexture(value, uniform.name);
						this.value.activeTexture().bind();
						break;
				}
			}
		});

		this._program.setUniformTexture(this._framebuffer.texture, 'uTexture');
		this._framebuffer.texture.activeTexture().bind();

		return this;
	}
	draw() {
		this._gl.disable(CULL_FACE);

		this._gl.viewport(0, 0, this._width, this._height);
		this._gl.clear(0, 0, 0, 1);
		this._gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);

		this._gl.disable(BLEND);

		this._gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_SHORT, 0);

		return this;
	}
	resize(width, height) {
		this._width = width;
		this._height = height;

		this._framebuffer.updateSize(this._width, this._height);
	}
}
