import { Program, ArrayBuffer } from 'tubugl-core';
import { FrameBuffer } from 'tubugl-core/src/frameBuffer';
import { COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, BLEND } from 'tubugl-constants';

const vertexShader = require('./shaders/blur.vert');
const fragmentShader = require('./shaders/blur.frag');
console.log(vertexShader);

export class Blur {
	constructor(gl, width, height) {
		this._gl = gl;

		this._time = 0;
		this.resize(width, height);

		this._makeFrameBuffers();
		this._makeProgram();
		this._makeAttributes();
	}
	_makeFrameBuffers() {
		let frontFramebuffer = new FrameBuffer(this._gl, {}, this._width, this._height);
		frontFramebuffer.makeDepthBUffer();
		frontFramebuffer.unbind();
		let backFramebuffer = new FrameBuffer(this._gl, {}, this._width, this._height);
		backFramebuffer.makeDepthBUffer();
		backFramebuffer.unbind();
		this._framebuffers = {
			front: frontFramebuffer,
			back: backFramebuffer,
			read: frontFramebuffer,
			write: backFramebuffer
		};
	}
	bind() {
		this._framebuffers.write.bind();
		return this;
	}
	unbind() {
		this._framebuffers.write.unbind();
		return this;
	}
	getWriteTexture() {
		return this._framebuffers.write.texture;
	}
	swap() {
		if (this._framebuffers.read == this._framebuffers.front) {
			this._framebuffers.read = this._framebuffers.back;
			this._framebuffers.write = this._framebuffers.front;
		} else {
			this._framebuffers.read = this._framebuffers.front;
			this._framebuffers.write = this._framebuffers.back;
		}
		return this;
	}

	_makeProgram() {
		this._program = new Program(this._gl, vertexShader, fragmentShader);
	}

	_makeAttributes() {
		this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array([0, 0, 1, 0, 0, 1]));
		this._positionBuffer.setAttribs('position', 2);
	}

	draw() {
		let iterations = 7;

		this._program.bind();
		for (let ii = 0; ii < iterations; ii++) {
			var radius = iterations / 2 - parseInt(ii / 2);

			if (ii == iterations - 1) {
				this._framebuffers.write.unbind();
				this._framebuffers.read.unbind();
			} else this._framebuffers.write.bind();

			this._positionBuffer.bind().attribPointer(this._program);

			this._program.setUniformTexture(this._framebuffers.read.texture, 'uTexture');
			this._framebuffers.read.texture.activeTexture().bind();

			if (ii % 2 == 0.0)
				this._gl.uniform2f(this._program.getUniforms('uDirection').location, radius, 0);
			else this._gl.uniform2f(this._program.getUniforms('uDirection').location, 0, radius);

			this._gl.uniform2f(
				this._program.getUniforms('uWindow').location,
				this._width,
				this._height
			);

			this._gl.uniform1f(
				this._program.getUniforms('uWindowRate').location,
				this._height / this._width
			);

			this._gl.viewport(0, 0, this._width, this._height);

			this._gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);
			this._gl.disable(BLEND);

			this._gl.drawArrays(this._gl.TRIANGLES, 0, 3);

			this.swap();
		}

		return this;
	}

	resize(width, height) {
		this._width = width;
		this._height = height;
		this._windowRate = this._height / this._width;

		if (this._framebuffers) {
			if (this._framebuffers.front)
				this._framebuffers.front.updateSize(this._width, this._height);
			if (this._framebuffers.back)
				this._framebuffers.back.updateSize(this._width, this._height);
		}
	}
}
