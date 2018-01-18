import { Program, ArrayBuffer } from 'tubugl-core';
import { FrameBuffer } from 'tubugl-core/src/frameBuffer';
import { COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, BLEND } from 'tubugl-constants';

const baseVertexShader = require('./shaders/bloomBase.vert');
const baseFragmentShader = require('./shaders/bloomBase.frag');
const vertexShader = require('./shaders/blur.vert');
const fragmentShader = require('./shaders/blur.frag');
const ouputFragShader = require('./shaders/bloom2.frag');

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
        this.framebufferArray = [];

        for (let ii = 0; ii < 4; ii++) {


            let width = parseInt(this._width / (ii + 1));
            let height = parseInt(this._height / (ii + 1));
            console.log(width, height);
            let frontFramebuffer = new FrameBuffer(this._gl, {}, width, height);
            frontFramebuffer.makeDepthBUffer().unbind();
            let backFramebuffer = new FrameBuffer(this._gl, {}, width, height);
            backFramebuffer.makeDepthBUffer().unbind();
            let framebuffers = {
                front: frontFramebuffer,
                back: backFramebuffer,
                read: frontFramebuffer,
                write: backFramebuffer
            };

            this.framebufferArray.push(framebuffers);
        }

    }
    bind(index = 0) {
        this.framebufferArray[index].write.bind();
        return this;
    }
    unbind() {
        this.framebufferArray.forEach(frameBuffer => {
            // frameBuffer.write.unbind();
            frameBuffer.read.unbind();
        });
        return this;
    }
    getWriteTexture(ii = 0) {
        return this.framebufferArray[ii].write.texture;
    }
    swap(ii = 0) {
        let frameBuffer = this.framebufferArray[ii];
        if (frameBuffer.read == frameBuffer.front) {
            frameBuffer.read = frameBuffer.back;
            frameBuffer.write = frameBuffer.front;
        } else {
            frameBuffer.read = frameBuffer.front;
            frameBuffer.write = frameBuffer.back;
        }
        return this;
    }
    swapAll() {
        for (let ii = 0; ii < this.framebufferArray.length; ii++) this.swap(ii);
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

        this.swapAll();

        this._program.bind();
        for (let jj = 1; jj < 4; jj++) {
            let frameBuffer = this.framebufferArray[jj];
            let scale = (jj + 1);
            for (let ii = 0; ii < iterations; ii++) {

                var radius = 1; //iterations / 2 - parseInt(ii / 2);

                frameBuffer.write.bind();

                this._positionBuffer.bind().attribPointer(this._program);

                this._program.setUniformTexture(frameBuffer.read.texture, 'uTexture');
                frameBuffer.read.texture.activeTexture().bind();

                if (ii % 2 == 0.0)
                    this._gl.uniform2f(this._program.getUniforms('uDirection').location, radius, 0);
                else this._gl.uniform2f(this._program.getUniforms('uDirection').location, 0, radius);

                let width = this._width / scale;
                let height = this._height / scale;

                this._gl.uniform2f(
                    this._program.getUniforms('uWindow').location,
                    width,
                    height
                );

                this._gl.uniform1f(
                    this._program.getUniforms('uWindowRate').location,
                    this._height / this._width
                );

                this._gl.viewport(0, 0, width, height);

                this._gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);
                this._gl.disable(BLEND);

                this._gl.drawArrays(this._gl.TRIANGLES, 0, 3);

                this.swap(jj);
            }
        }

        this.unbind();

        this._finalProgram.bind();
        this._positionBuffer.bind().attribPointer(this._finalProgram);

        this._gl.uniform1f(
            this._finalProgram.getUniforms('uWindowRate').location,
            this._height / this._width
        );
        // let overlayVal = 0.5;
        // this._gl.uniform1f(this._finalProgram.getUniforms('uOverlay').location, overlayVal);

        for (var ii = 0; ii < 4; ii++) {
            this._finalProgram.setUniformTexture(this.framebufferArray[ii].read.texture, 'uBlurTexture' + ii);
            this.framebufferArray[ii].read.texture.activeTexture().bind();
        }

        this._gl.viewport(0, 0, this._width, this._height);

        this._gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);
        this._gl.disable(BLEND);

        this._gl.drawArrays(this._gl.TRIANGLES, 0, 3);


        return this;
    }

    resize(width, height) {


        this._width = width;
        this._height = height;

        // this._winWidth = width ;
        // this._winHeight = height scale;
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