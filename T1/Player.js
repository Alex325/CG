import { GameObject } from './GameObject.js';
import { setDefaultMaterial } from '../libs/util/util.js';
import * as THREE from 'three';

export class Player extends GameObject {

    #camera;
    #airplane;
    #collplane;
    #speed = 20;
    #raycast;

    constructor() {
        super();
        
        this.#camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
        this.#camera.position.set(0, 0, -150);
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0));
        
        const airplaneGeometry = new THREE.BoxGeometry(20, 20, 20);
        const airplaneMaterial = setDefaultMaterial('red');
        this.#airplane = new THREE.Mesh(airplaneGeometry, airplaneMaterial);
        
        const collplaneGeometry = new THREE.PlaneGeometry(100, 100);
        const collplaneMaterial = setDefaultMaterial('black');
        collplaneMaterial.wireframe = true;
        this.#collplane = new THREE.Mesh(collplaneGeometry, collplaneMaterial);
        this.#collplane.material.side = THREE.DoubleSide;
        this.#collplane.position.set(0, 0, -20);
        
        this.#raycast = new THREE.Raycaster();
        
        this._object.add(this.#camera);
        this._object.add(this.#collplane);
        this._object.add(this.#airplane);
        
        this._object.position.set(0, 20, -200);
        
    }
    
    #resizePlane() {
        const distance = this.#camera.position.z - this.#collplane.position.z;
        const vFov = THREE.MathUtils.degToRad(this.#camera.fov);
        const height = 2 * Math.tan(vFov / 2) * distance;
        const width = height * this.#camera.aspect;
        
        this.#collplane.scale.set(width, height, 1);
    }
    
    getCamera() {
        return this.#camera;
    }
    
    update(dt, game) {
        this.#resizePlane();
        this._object.translateZ(this.#speed*dt);

        game.getRaycaster().setFromCamera(game.getMousePos(), this.#camera);
        
        const hit = game.getRaycaster().intersectObject(this.#collplane)[0];
        
        if (!hit) return;
        
        const { x, y } = hit.point.sub(this._object.position);

        this.#airplane.position.set(x, y, 0);

        console.log(`${x}, ${y}\n${this.#airplane.position.x}, ${this.#airplane.position.y}`);
        
        

    }

    setSpeed(newSpeed) {
        this.#speed = newSpeed;
    }
}