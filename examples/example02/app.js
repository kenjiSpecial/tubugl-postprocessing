/**
 * make demo with rendering of plane(webgl)
 */

const dat = require('dat.gui/build/dat.gui.min');
const TweenLite = require('gsap/TweenLite');
const Stats = require('stats.js');

import { COLOR_BUFFER_BIT, DEPTH_TEST, DEPTH_BUFFER_BIT } from 'tubugl-constants';
// import { Sphere } from 'tubugl-3d-shape';
import { Sphere } from './sphere';
import { PerspectiveCamera, CameraController } from 'tubugl-camera';
import { mathUtils } from 'tubugl-utils';
import { randomFloat } from 'tubugl-utils/src/mathUtils';
import { Bloom } from '../../src/bloom';

export default class App {
    constructor(params = {}) {
        this._isMouseDown = false;
        this._isPlaneAnimation = false;
        this._width = params.width ? params.width : window.innerWidth;
        this._height = params.height ? params.height : window.innerHeight;

        this.canvas = document.createElement('canvas');
        this.gl = this.canvas.getContext('webgl');

        this._setClear();
        this._makeSpheres();
        this._makeCamera();
        this._makeCameraController();
        this._makeBloom();
        this.isPost = true;

        this.resize(this._width, this._height);

        if (params.isDebug) {
            this.stats = new Stats();
            document.body.appendChild(this.stats.dom);
            this._addGui();
        } else {
            let desc = document.getElementById('tubugl-desc');
            desc.style.display = 'none';
        }
    }

    animateIn() {
        this.isLoop = true;
        TweenLite.ticker.addEventListener('tick', this.loop, this);
    }

    loop() {
        if (this.stats) this.stats.update();
        this._camera.update();
        for (var ii = 0; ii < 2; ii++) {
            if (ii == 1) {
                this._bloom.bind();
                this._bloom.bloomProgram.bind();
            } else {
                this._bloom.bindMainTarget();
            }
            let scale;
            if (ii == 1) scale = 2;
            else scale = 1;
            this.gl.viewport(0, 0, this._width / scale, this._height / scale);
            this.gl.clearColor(0, 0, 0, 1);
            this.gl.enable(DEPTH_TEST);
            this.gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);



            this._spheres.forEach(sphere => {
                if (ii == 1) sphere.render(this._camera, this._bloom.bloomProgram);
                else sphere.render(this._camera);
            });
        }

        if (this.isPost) this._bloom.draw();

        // this._bloom.unbind();

        // this.gl.viewport(0, 0, this._width, this._height);
        // this.gl.clearColor(0, 0, 0, 1);
        // this.gl.enable(DEPTH_TEST);
        // this.gl.clear(COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT);

        // this._camera.update();

        // this._spheres.forEach(sphere => {
        //     sphere.render(this._camera);
        // });

    }

    animateOut() {
        TweenLite.ticker.removeEventListener('tick', this.loop, this);
    }

    onKeyDown(ev) {
        switch (ev.which) {
            case 27:
                this._playAndStop();
                break;
        }
    }

    _playAndStop() {
        this.isLoop = !this.isLoop;
        if (this.isLoop) {
            TweenLite.ticker.addEventListener('tick', this.loop, this);
            this.playAndStopGui.name('pause');
        } else {
            TweenLite.ticker.removeEventListener('tick', this.loop, this);
            this.playAndStopGui.name('play');
        }
    }

    resize(width, height) {
        this._width = width;
        this._height = height;

        this.canvas.width = this._width;
        this.canvas.height = this._height;
        this.gl.viewport(0, 0, this._width, this._height);

        this._spheres.forEach(sphere => {
            sphere.resize(this._width, this._height);
        });
        this._camera.updateSize(this._width, this._height);
        // this._postProcess.resize(this._width, this._height);
    }

    destroy() {}

    _setClear() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(DEPTH_TEST);
    }

    _makeSpheres() {
        this._spheres = [];
        for (let ii = 0; ii < 10; ii++) {
            let side = mathUtils.randomFloat(80, 150);

            let sphere = new Sphere(
                this.gl, { isWire: false },
                side,
                15,
                15
            );
            sphere.position.y = randomFloat(-100, 100);
            sphere.position.x = randomFloat(-600, 600);
            sphere.position.z = randomFloat(-600, 600);

            this._spheres.push(sphere);
        }
    }

    _makeCamera() {
        this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 60, 1, 10000);
        this._camera.position.z = 1000;
        this._camera.position.x = -1000;
        this._camera.position.y = 300;
        this._camera.lookAt([0, 0, 0]);
    }

    _makeCameraController() {
        this._cameraController = new CameraController(this._camera, this.canvas);
        this._cameraController.minDistance = 1000;
        this._cameraController.maxDistance = 3000;
    }

    _makeBloom() {
        this._bloom = new Bloom(this.gl, window.innerWidth, window.innerHeight);
    }

    _addGui() {
        this.gui = new dat.GUI();
        this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
        this.gui.add(this, 'isPost');
    }
}