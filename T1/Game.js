import * as THREE from 'three';
import { initRenderer, onWindowResize } from '../libs/util/util.js';
import { Player } from './Player.js'
import { Ground } from './Ground.js';

export class Game {

    #scene;
    #renderer;
    #clock;
    #camera;
    #globalLight;
    #gameObjects;

    constructor() {
        this.#init();
    }

    #init() {
        this.#scene = new THREE.Scene();
        this.#renderer = initRenderer('#1884d6');
        this.#clock = new THREE.Timer();
        this.#camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 100);
        this.#globalLight = new THREE.AmbientLight(0xffffff, 1);
        this.#gameObjects = [];

        this.#scene.add(this.#globalLight);
        this.#scene.add(new THREE.AxesHelper(20));

        this.#camera.position.set(20, 20, 20);
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0))

        window.onresize = () => { onWindowResize(this.#camera, this.#renderer); };

        this.instantiate(new Player());
        this.instantiate(new Ground());
    }

    #udpate(dt = 1/60) {
        for (const gameObject of this.#gameObjects) {
            gameObject.update(dt, this);
        }
    }

    instantiate(obj) {
        this.#gameObjects.push(obj);
        this.#scene.add(obj.getObj());
    }

    #render() {
        this.#renderer.render(this.#scene, this.#camera);
    }

    run() {
        requestAnimationFrame(this.run.bind(this));
        this.#clock.update();
        const dt = this.#clock.getDelta();
        this.#udpate(dt);
        this.#render();
    }
}