import { Program, ArrayBuffer } from 'tubugl-core';
import { FrameBuffer } from 'tubugl-core/src/frameBuffer';
import { COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, BLEND } from 'tubugl-constants';

const baseVertexShader = require('./shaders/bloomBase.vert');
const baseFragmentShader = require('./shaders/bloomBase.frag');
const vertexShader = require('./shaders/blur.vert');
const fragmentShader = require('./shaders/blur.frag');
const ouputFragShader = require('./shaders/bloom.frag');

export class Bloom {
    constructor(gl, width, height) {
        this._gl = gl;

        this._time = 0;
        this.resize(width, height);

        this._makeFrameBuffers();
        this._makeProgram();
        this._makeAttributes();
    }
    _makeFrameBuffers() {
        let frontFramebuffer = new FrameBuffer(this._gl, {}, this._winWidth, this._winHeight);
        frontFramebuffer.makeDepthBUffer().unbind();
        let backFramebuffer = new FrameBuffer(this._gl, {}, this._winWidth, this._winHeight);
        backFramebuffer.makeDepthBUffer().unbind();
        this._framebuffers = {
            front: frontFramebuffer,
            back: backFramebuffer,
            read: frontFramebuffer,
            write: backFramebuffer
        };

        this.targetFrameBuffer = new FrameBuffer(this._gl, {}, this._width, this._height);
        this.targetFrameBuffer.makeDepthBUffer().unbind();

    }
    bind() {
        this._framebuffers.write.bind();
        return this;
    }
    unbind() {
        this._framebuffers.write.unbind();
        this._framebuffers.read.unbind();
        return this;
    }
    bindMainTarget() {
        this.targetFrameBuffer.bind();
        return this;
    }
    unbindMainTarget() {
        this.targetFrameBuffer.unbind();
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
        this.bloomProgram = new Program(this._gl, baseVertexShader, baseFragmentShader);
        this._program = new Program(this._gl, vertexShader, fragmentShader);
        this._finalProgram = new Program(this._gl, vertexShader, ouputFragShader);
    }

    _makeAttributes() {
        this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array([0, 0, 1, 0, 0, 1]));
        this._positionBuffer.setAttribs('position', 2);
    }

    draw() {
        let iterations = 2;
        this.swap();

        this._program.bind();
        for (let ii = 0; ii < iterations; ii++) {
            var radius = iterations / 2 - parseInt(ii / 2);

            this._framebuffers.write.bind();

            this._positionBuffer.bind().attribPointer(this._program);

            this._program.setUniformTexture(this._framebuffers.read.texture, 'uTexture');
            this._framebuffers.read.texture.activeTexture().bind();

            if (ii % 2 == 0.0)
                this._gl.uniform2f(this._program.getUniforms('uDirection').location, radius, 0);
            else this._gl.uniform2f(this._program.getUniforms('uDirection').location, 0, radius);

            this._gl.uniform2f(
                this._program.getUniforms('uWindow').location,
                this._winWidth,
                this._winHeight
            );

            this._gl.uniform1f(
                this._program.getUniforms('uWindowRate').location,
                this._height / this._width
            );

            this._gl.viewport(0, 0, this._winWidth, this._winHeight);

            this._gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);
            this._gl.disable(BLEND);

            this._gl.drawArrays(this._gl.TRIANGLES, 0, 3);

            this.swap();
        }

        this.unbind();

        this._finalProgram.bind();
        this._positionBuffer.bind().attribPointer(this._finalProgram);

        this._gl.uniform1f(
            this._finalProgram.getUniforms('uWindowRate').location,
            this._height / this._width
        );
        let overlayVal = 0.5;
        this._gl.uniform1f(this._finalProgram.getUniforms('uOverlay').location, overlayVal);

        this._finalProgram.setUniformTexture(this.targetFrameBuffer.texture, 'uMainTexture');
        this.targetFrameBuffer.texture.activeTexture().bind();

        this._finalProgram.setUniformTexture(this._framebuffers.read.texture, 'uBlurTexture');
        this._framebuffers.read.texture.activeTexture().bind();

        this._gl.viewport(0, 0, this._width, this._height);

        this._gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);
        this._gl.disable(BLEND);

        this._gl.drawArrays(this._gl.TRIANGLES, 0, 3);


        return this;
    }

    resize(width, height) {


        this._width = width;
        this._height = height;
        let scale = 2;
        this._winWidth = width / scale;
        this._winHeight = height / scale;
        // console.log(this._wid);

        this._windowRate = this._height / this._width;

        if (this._framebuffers) {
            if (this._framebuffers.front)
                this._framebuffers.front.updateSize(this._winWidth, this._winHeight);
            if (this._framebuffers.back)
                this._framebuffers.back.updateSize(this._winWidth, this._winHeight);
        }
    }
}