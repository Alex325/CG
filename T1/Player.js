import { GameObject } from './GameObject.js';
import { setDefaultMaterial } from '../libs/util/util.js';
import * as THREE from 'three';

export class Player extends GameObject {

    #camera;
    #airplane;
    #collplane;
    #speed = 20;

    constructor() {
        super();
        
        this.#camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 1000);
        this.#camera.position.set(0, 0, -200);
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0));
        
        this.#buildPlane();
        
        const collplaneGeometry = new THREE.PlaneGeometry(100, 100);
        const collplaneMaterial = setDefaultMaterial('black');
        collplaneMaterial.wireframe = true;
        this.#collplane = new THREE.Mesh(collplaneGeometry, collplaneMaterial);
        this.#collplane.material.side = THREE.DoubleSide;
        this.#collplane.position.set(0, 0, -20);
                
        this._object.add(this.#camera);
        this._object.add(this.#collplane);
        this._object.add(this.#airplane);
        
        this._object.position.set(0, 200, -200);
        
    }
    
    #buildPlane() {

        const airplane = new THREE.Group();

        const bodyGeometry = new THREE.CapsuleGeometry(20, 50, 20, 20);
        const bodyMaterial = setDefaultMaterial('orange');
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);


        const wingsGeometry = new THREE.SphereGeometry(20, 20, 20);
        const wingsMaterial = setDefaultMaterial('lightgreen');
        const wings = new THREE.Mesh(wingsGeometry, wingsMaterial);

        body.rotateX(THREE.MathUtils.degToRad(-90));
        wings.scale.set(5, 0.5, 0.5);
        wings.translateZ(10);

        airplane.add(body);
        airplane.add(wings);

        this.#airplane = airplane;
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
        
        const planePos = hit.point.sub(this._object.position);

        this.#airplane.position.lerp(planePos, 1 - 0.01**dt);        
        

    }

    setSpeed(newSpeed) {
        this.#speed = newSpeed;
    }
}