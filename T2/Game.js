import * as THREE from 'three';
import { initRenderer, onWindowResize } from '../libs/util/util.js';
import { Player } from './Player.js'
import { Ground } from './Ground.js';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js';
import { seed } from './noise.js';

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
    
    #stats;
    constructor() {
        this.#init();
    }

    #buildInterface() {    
       const gui = new GUI();
       gui.add(this.#scene.fog, 'far', 1001, 3000)
          .name("Fog Far");
    }

    #init() {

        seed(Math.random());
        
        const container = document.getElementById( 'container' );
        
        this.#scene = new THREE.Scene();
        this.#scene.fog = new THREE.Fog(0x607a8d, 1000, 3000)        
        this.#renderer = initRenderer('#607a8d');
        this.#renderer.shadowMap.type = THREE.VSMShadowMap;
        this.#clock = new THREE.Timer();

        this.#globalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.#globalLight.castShadow = true;
        this.#globalLight.position.set(-10, 500, 0);
        this.#globalLight.target.position.set(0, 0, 1000);
        this.#globalLight.shadow.mapSize.width = 1024;
        this.#globalLight.shadow.mapSize.height = 1024;
        this.#globalLight.shadow.camera.left = -1000;
        this.#globalLight.shadow.camera.right = 1000;
        this.#globalLight.shadow.camera.top = 400;
        this.#globalLight.shadow.camera.bottom = -250;
        this.#globalLight.shadow.camera.far = 2000;
        this.#globalLight.shadow.bias = -0.0001;


        this.#gameObjects = [];
        this.#player = this.instantiate(new Player());
        this.#camera = this.#player.getCamera();
        this.#mousePos = new THREE.Vector2();
        this.#stats = new Stats();

        container.append(this.#stats.dom);
        
        this.#buildInterface();

        this.#scene.add(this.#globalLight);
        this.#scene.add(this.#globalLight.target);

        //this.#scene.add(new THREE.CameraHelper(this.#globalLight.shadow.camera));        

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
        this.#stats.update();

        requestAnimationFrame(this.run.bind(this));
        this.#clock.update();
        const dt = this.#clock.getDelta();
        this.#udpate(dt);
        this.#render();
    }
}