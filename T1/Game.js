import * as THREE from 'three';
import { initRenderer, onWindowResize } from '../libs/util/util.js';
import { Player } from './Player.js'
import { Ground } from './Ground.js';

export class Game {

    #scene;
    #renderer;
    #clock;
    #player;
    #camera;
    #globalLight;
    #gameObjects;
    #mousePos;
    #raycaster;

    constructor() {
        this.#init();
    }

    #init() {
        this.#scene = new THREE.Scene();
        this.#renderer = initRenderer('#1884d6');
        this.#clock = new THREE.Timer();
        this.#globalLight = new THREE.AmbientLight(0xffffff, 1);
        this.#gameObjects = [];
        this.#player = this.instantiate(new Player());
        this.#camera = this.#player.getCamera();
        this.#mousePos = new THREE.Vector2();
        this.#scene.fog = new THREE.Fog(0xcccccc, 300, 1000)        

        this.#scene.add(this.#globalLight);

        window.onresize = () => { onWindowResize(this.#camera, this.#renderer); };
        window.onmousemove = e => { 
            this.#mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.#mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        this.#raycaster = new THREE.Raycaster();

        void this.instantiate(new Ground());
    }

    #udpate(dt = 1/60) {
        for (const gameObject of this.#gameObjects) {
            gameObject.update(dt, this);
        }

    }

    getRaycaster() {
        return this.#raycaster;
    }

    getMousePos() {
        return this.#mousePos;
    }

    instantiate(obj) {
        this.#gameObjects.push(obj);
        this.#scene.add(obj.getObj());

        return obj;
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