import { GameObject } from './GameObject.js';
import { setDefaultMaterial } from '../libs/util/util.js';
import * as THREE from 'three';

export class Player extends GameObject {

    #camera;
    #airplane;
    #collplane;
    #aimTarget;
    #aimTargetParent;
    #prevPos;
    #speed = 500;

    constructor() {
        super();
        
        this.#createCamera();
        this.#buildAirplane();
        this.#buildPlane();

        this.#aimTargetParent = new THREE.Object3D();
        this.#aimTarget = new THREE.Object3D();
        this.#aimTargetParent.add(this.#aimTarget);
        
        this._object.add(this.#camera);
        this._object.add(this.#collplane);
        this._object.add(this.#airplane);
        this._object.add(this.#aimTargetParent);
        
        this._object.position.set(0, 500, -200);


        
    }
    
    #createCamera() {
        this.#camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 3000);
        this.#camera.position.set(0, 0, -200);
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    #buildPlane() {
        const collplaneGeometry = new THREE.PlaneGeometry(1, 1);
        const collplaneMaterial = setDefaultMaterial('black');
        collplaneMaterial.wireframe = false;
        this.#collplane = new THREE.Mesh(collplaneGeometry, collplaneMaterial);
        this.#collplane.material.side = THREE.DoubleSide;
        this.#collplane.visible = false;
        this.#collplane.position.set(0, 0, 200);
        this.#prevPos = this.#collplane.position.clone();
    }

    #buildAirplane() {

        const airplane = new THREE.Group();

        const bodyGeometry = new THREE.CapsuleGeometry(20, 50, 20, 20);
        const bodyMaterial = setDefaultMaterial('cornflowerblue');
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

        const engineGeometry = new THREE.CylinderGeometry(10, 5, 20);
        const engineMaterial = setDefaultMaterial('#076632');
        const engine1 = new THREE.Mesh(engineGeometry, engineMaterial);
        const engine2 = new THREE.Mesh(engineGeometry, engineMaterial);
        const engine3 = new THREE.Mesh(engineGeometry, engineMaterial);
        const engine4 = new THREE.Mesh(engineGeometry, engineMaterial);

        const spotlight = new THREE.SpotLight(0xffffff);
        spotlight.name = "spotlight"
        spotlight.castShadow = true;
        spotlight.intensity = 1_000_000;
        spotlight.distance = 0;
        spotlight.angle = THREE.MathUtils.DEG2RAD * 30;
        spotlight.penumbra = 0.5;
        spotlight.shadow.mapSize.width = 512;
        spotlight.shadow.mapSize.height = 512;
        spotlight.shadow.camera.far = 1000;
        spotlight.shadow.bias = -0.0001;
        
        body.rotateX(THREE.MathUtils.degToRad(-90));
        wings.scale.set(5, 0.5, 0.5);
        winglet1.scale.set(3, 0.5, 0.5);
        winglet2.scale.set(0.5, 2, 0.25);
        wings.translateZ(10);
        winglet1.translateZ(-30);
        winglet2.translateZ(-30);
        winglet2.translateY(25);
        engine1.translateX(80);
        engine2.translateX(40);
        engine3.translateX(-40);
        engine4.translateX(-80);
        engine1.translateY(-10);
        engine2.translateY(-10);
        engine3.translateY(-10);
        engine4.translateY(-10);
        engine1.rotateX(THREE.MathUtils.DEG2RAD * 90);
        engine2.rotateX(THREE.MathUtils.DEG2RAD * 90);
        engine3.rotateX(THREE.MathUtils.DEG2RAD * 90);
        engine4.rotateX(THREE.MathUtils.DEG2RAD * 90);
        spotlight.position.set(0, 0, 50);
        spotlight.target.position.set(0, -1, 1);
        
        airplane.add(body);
        airplane.add(wings);
        airplane.add(winglet1);
        airplane.add(winglet2);
        airplane.add(engine1);
        airplane.add(engine2);
        airplane.add(engine3);
        airplane.add(engine4);
        airplane.add(spotlight);
        spotlight.add(spotlight.target);


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
    
    #moveTowards(current, target, maxDistanceDelta) {
        const direction = new THREE.Vector3().subVectors(target, current);
        const distance = direction.length();

        if (distance <= maxDistanceDelta || distance === 0) return target.clone();

        return current.clone().add(direction.divideScalar(distance).multiplyScalar(maxDistanceDelta));
    }
    
    getCamera() {
        return this.#camera;
    }
    
    #worldToViewport(pos) {
        const vector = pos.clone();
        return vector.project(this.#camera);
    }
    
    #viewportToWorld(pos) {

        const vector = pos.clone();

        return vector.unproject(this.#camera);
        
    }

    #clamp(pos) {
        const local = pos.clone();

        const viewport = this.#worldToViewport(local);

        viewport.x = THREE.MathUtils.clamp(viewport.x, -0.72, 0.72);
        viewport.y = THREE.MathUtils.clamp(viewport.y, -0.72, 0.72);

        const global = this.#viewportToWorld(viewport);

        return global;

    }

    update(dt, game) {
        this.#resizePlane();

        game.getRaycaster().setFromCamera(game.getMousePos(), this.#camera);
        const planeHit = game.getRaycaster().intersectObject(this.#collplane)[0];

        if (planeHit) {
            const { x, y, z } = planeHit.point;

            const local = this.#clamp(new THREE.Vector3(x, y, z));

            const moveDir = local.clone().sub(this._object.position);

            const ndcAirplane = this.#worldToViewport(this.#airplane.position.clone().add(this._object.position));
            const ndcLocal = this.#worldToViewport(local);
            const ndcDelta = ndcLocal.sub(ndcAirplane);
            this.#prevPos = moveDir.clone();

            this.#moveAirplane(moveDir, dt);
            this.#rotateAirplane((new THREE.Vector2(-ndcDelta.x, ndcDelta.y)).multiplyScalar(25), dt);
            this.#lean(Math.sign(Math.abs(ndcDelta.x) > 0.025 ? ndcDelta.x : 0), 70, dt);
        } else {

            this.#moveAirplane(this.#prevPos, dt);
            this.#rotateAirplane(0, dt);
            this.#lean(0, 70, dt);

        }
    }

    #moveAirplane(dir, dt) {
        this.#airplane.position.copy(this.#moveTowards(this.#airplane.position, dir, this.#speed * dt));
    }

    #lean(deltaH, maxLean, dt) {

        this.#airplane.rotation.z = THREE.MathUtils.lerp(this.#airplane.rotation.z, THREE.MathUtils.DEG2RAD * (deltaH * maxLean), 1 - 0.01 ** dt);

    }

    #rotateAirplane(delta, dt) {
        this.#aimTarget.position.set(/*delta.x*/ 0, /*delta.y*/ 0, 10);

        this.#aimTargetParent.lookAt(this.#aimTarget.position.clone().add(this._object.position));

        const targetQuaternion = this.#aimTargetParent.quaternion;

        this.#airplane.quaternion.slerp(targetQuaternion, 1 - 0.05 ** dt);
    }
}