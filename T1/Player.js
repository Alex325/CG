import { GameObject } from './GameObject.js';
import { setDefaultMaterial } from '../libs/util/util.js';
import * as THREE from 'three';

export class Player extends GameObject {

    #camera;
    #airplane;
    #collplane;
    #speed = 20;
    #curLookAt;


    constructor() {
        super();
        
        this.#camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 2000);
        this.#camera.position.set(0, 0, -200);
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0));
        
        this.#buildPlane();
        
        const collplaneGeometry = new THREE.PlaneGeometry(100, 100);
        const collplaneMaterial = setDefaultMaterial('black');
        collplaneMaterial.wireframe = true;
        this.#collplane = new THREE.Mesh(collplaneGeometry, collplaneMaterial);
        this.#collplane.material.side = THREE.DoubleSide;
        this.#collplane.visible = false;
        this.#collplane.position.set(0, 0, 100);
        
        
        this._object.add(this.#camera);
        this._object.add(this.#collplane);
        this._object.add(this.#airplane);
        
        this._object.position.set(0, 200, -200);

        this.#curLookAt = new THREE.Vector3(0, 0, 100);
        
    }
    
    #buildPlane() {

        const airplane = new THREE.Group();

        const bodyGeometry = new THREE.CapsuleGeometry(20, 50, 20, 20);
        const bodyMaterial = setDefaultMaterial('orange');
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);


        const wingsGeometry = new THREE.SphereGeometry(20, 20, 20);
        const wingsMaterial = setDefaultMaterial('lightgreen');
        const wings = new THREE.Mesh(wingsGeometry, wingsMaterial);

        const winglet1Geometry = new THREE.SphereGeometry(20, 20, 20);
        const winglet1Material = setDefaultMaterial('#10cc10');
        const winglet1 = new THREE.Mesh(winglet1Geometry, winglet1Material);

        const winglet2Geometry = new THREE.SphereGeometry(20, 20, 20);
        const winglet2Material = setDefaultMaterial('#10cc10');
        const winglet2 = new THREE.Mesh(winglet2Geometry, winglet2Material);

        body.rotateX(THREE.MathUtils.degToRad(-90));
        wings.scale.set(5, 0.5, 0.5);
        winglet1.scale.set(3, 0.5, 0.5);
        winglet2.scale.set(0.5, 2, 0.25);
        wings.translateZ(10);
        winglet1.translateZ(-30);
        winglet2.translateZ(-30);
        winglet2.translateY(25);

        airplane.add(body);
        airplane.add(wings);
        airplane.add(winglet1);
        airplane.add(winglet2);

        this.#airplane = airplane;

        this.#airplane.position.set(0, 0, 90);
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
        const planeHit = game.getRaycaster().intersectObject(this.#collplane)[0];
        
        const hit = this.#castFromPlane(game);

        if (!hit) return;        
        if (!planeHit) return;
        
        const { x, y, z } = planeHit.point;

        const moveTarget = new THREE.Vector3(x - this._object.position.x, y - this._object.position.y, this.#airplane.position.z);
        const lookAtTarget = (new THREE.Vector3(x, y, z)).sub(this._object.position).add(new THREE.Vector3(0, 0, 100));

        this.#airplane.position.lerp(moveTarget, 1 - 0.01**dt);

        this.#curLookAt.lerp(lookAtTarget, 1 - 0.0001**dt);

        this.#airplane.lookAt(this.#curLookAt.clone().add(this._object.position));
        

    }

    #castFromPlane(game) {
        const airplanePos = this.#airplane.position.clone();
        const frontVector = new THREE.Vector3();
        this._object.getWorldDirection(frontVector);
        game.getRaycaster().set(airplanePos.add(this._object.position), frontVector);
        const hit = game.getRaycaster().intersectObject(this.#collplane)[0];
        return hit;
    }

    setSpeed(newSpeed) {
        this.#speed = newSpeed;
    }
}