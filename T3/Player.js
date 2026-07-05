import { GameObject } from './GameObject.js';
import { setDefaultMaterial } from './libs/util/util.js';
import * as THREE from 'three';
import { Bullet } from './Bullet.js';
import { Game } from './Game.js';
import { SoundManager } from './SoundManager.js';
import { AssetManager } from './AssetManager.js';

export class Player extends GameObject {

    /**
     * @type {THREE.PerspectiveCamera}
     */
    #camera;
    /**
     * @type {THREE.Group}
     */
    #airplane;
    #collplane;
    #aimTarget;
    #aimTargetParent;
    #prevPos;
    #speed = 600;
    #bounds = new THREE.Vector2(100, 24);
    #isShooting = false;
    #wantsToShoot = false;
    #fireCooldown = 0.2;
    #cooldown = 0;
    maxHealth = 100;
    health = 100;

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
        
        this._object.position.set(0, 600, -200);

        this.#setupInput();
    }

    #setupInput() {
        // LMB hold fires at fixed interval
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.#isShooting = true;
            }
        });
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.#isShooting = false;
            }
        });
        // fallback: Space single-shot
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.#wantsToShoot = true;
            }
        });
    }
    
    #createCamera() {
        this.#camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 3000);
        this.#camera.position.set(0, 0, -200);
        this.#camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    #buildPlane() {
        const collplaneGeometry = new THREE.PlaneGeometry(1, 1);
        const collplaneMaterial = setDefaultMaterial('black');
        collplaneMaterial.wireframe = true;
        this.#collplane = new THREE.Mesh(collplaneGeometry, collplaneMaterial);
        this.#collplane.material.side = THREE.DoubleSide;
        this.#collplane.visible = false;
        this.#collplane.position.set(0, 0, 200);
        this.#prevPos = this.#collplane.position.clone();
    }

    #buildAirplane() {

        const airplane = new THREE.Group();
        airplane.name = 'airplane';

        const bodyGeometry = new THREE.CapsuleGeometry(20, 50, 20, 20);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 'cornflowerblue', shininess: 1000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);


        const wingsGeometry = new THREE.SphereGeometry(20, 20, 20);
        const wingsMaterial = new THREE.MeshPhongMaterial({ color: 'lightgreen' });
        const wings = new THREE.Mesh(wingsGeometry, wingsMaterial);

        const winglet1Geometry = new THREE.SphereGeometry(20, 20, 20);
        const winglet1Material = new THREE.MeshPhongMaterial({ color: '#10cc10' });
        const winglet1 = new THREE.Mesh(winglet1Geometry, winglet1Material);

        const winglet2Geometry = new THREE.SphereGeometry(20, 20, 20);
        const winglet2Material = new THREE.MeshPhongMaterial({ color: '#10cc10' });
        const winglet2 = new THREE.Mesh(winglet2Geometry, winglet2Material);

        const engineGeometry = new THREE.CylinderGeometry(10, 5, 20);
        const engineMaterial = new THREE.MeshPhongMaterial({ color: '#076632' });
        const engine1 = new THREE.Mesh(engineGeometry, engineMaterial);
        const engine2 = new THREE.Mesh(engineGeometry, engineMaterial);
        const engine3 = new THREE.Mesh(engineGeometry, engineMaterial);
        const engine4 = new THREE.Mesh(engineGeometry, engineMaterial);

        const spotlight = new THREE.SpotLight(0xffffff);
        spotlight.name = "spotlight"
        spotlight.intensity = 1_000_000;
        spotlight.distance = 0;
        spotlight.angle = THREE.MathUtils.DEG2RAD * 30;
        spotlight.penumbra = 0.5;
        spotlight.shadow.mapSize.width = 512;
        spotlight.shadow.mapSize.height = 512;
        spotlight.shadow.camera.far = 1000;
        spotlight.shadow.bias = -0.0001;

        spotlight.position.set(0, 0, 50);
        spotlight.target.position.set(0, -1, 1);
        
        const airplaneModel = AssetManager.models.airplane.clone(true);
        airplaneModel.scale.set(4, 4, 4);
        airplaneModel.rotation.y = Math.PI/2;
        airplane.add(airplaneModel);
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
    
    /**
     * 
     * @param {THREE.Vector3} pos 
     * @returns {THREE.Vector3}
     */
    #worldToViewport(pos) {
        const vector = pos.clone();
        return vector.project(this.#camera);
    }
    
    /**
     * 
     * @param {THREE.Vector3} pos 
     * @returns {THREE.Vector3}
     */
    #viewportToWorld(pos) {

        const vector = pos.clone();

        return vector.unproject(this.#camera);
        
    }

    /**
     * 
     * @param {THREE.Vector3} pos 
     * @returns {THREE.Vector3}
     */
    #clampPlane(pos) {
        const local = pos.clone();

        const viewport = this.#worldToViewport(local);

        viewport.x = THREE.MathUtils.clamp(viewport.x, -0.72, 0.72);
        viewport.y = THREE.MathUtils.clamp(viewport.y, -0.72, 0.72);

        const global = this.#viewportToWorld(viewport);

        return global;

    }

    /**
     * 
     * @param {number} dt 
     * @param {Game} game 
     * @returns 
     */
    update(dt, game) {
        if (!game.isCursorLocked()) return;
        this.#resizePlane();

        if (game.godMode) this.health = this.maxHealth;

        game.getRaycaster().setFromCamera(game.getAimNDC(), this.#camera);
        const planeHit = game.getRaycaster().intersectObject(this.#collplane)[0];

        if (planeHit) {
            const { x, y, z } = planeHit.point;

            const local = this.#clampPlane(new THREE.Vector3(x, y, z));

            const moveDir = local.clone();

            this._object.worldToLocal(moveDir);
            
            const ndcAirplane = this.#worldToViewport(this.#airplane.position.clone().add(this._object.position));
            const ndcLocal = this.#worldToViewport(local);
            const ndcDelta = ndcLocal.sub(ndcAirplane);
            this.#prevPos = moveDir.clone();

            this.#moveAirplane(moveDir, dt);
            this.#rotateAirplane((new THREE.Vector2(-ndcDelta.x, ndcDelta.y)).multiplyScalar(25), dt);
            this.#lean(Math.sign(Math.abs(ndcDelta.x) > 0.025 ? ndcDelta.x : 0), 70, dt);
            
            if (Math.abs(ndcAirplane.x) > 0.5 && Math.sign(ndcDelta.x) === Math.sign(ndcAirplane.x) || true) {                
                this.#followTarget(moveDir, dt, 0);
            }
            if (Math.abs(ndcAirplane.y) > 0.5 && Math.sign(ndcDelta.y) === Math.sign(ndcAirplane.y) || true) {
                this.#followTarget(moveDir, dt, 1);
            }
        } else {
            this.#moveAirplane(this.#prevPos, dt);
            this.#rotateAirplane(0, dt);
            this.#lean(0, 70, dt);
        }

        this.#collplane.position.x = THREE.MathUtils.clamp(this.#collplane.position.x, -this.#bounds.x, this.#bounds.x);
        this.#collplane.position.y = THREE.MathUtils.clamp(this.#collplane.position.y, -this.#bounds.y, this.#bounds.y);
        this.#camera.position.x = THREE.MathUtils.clamp(this.#camera.position.x, -this.#bounds.x, this.#bounds.x);
        this.#camera.position.y = THREE.MathUtils.clamp(this.#camera.position.y, -this.#bounds.y, this.#bounds.y);

        if (this.#cooldown > 0) this.#cooldown = Math.max(0, this.#cooldown - dt);

        if (this.#isShooting && this.#cooldown <= 0) {
            this.#fireForward(game);
            this.#cooldown = this.#fireCooldown;
        }
        if (this.#wantsToShoot) {
            if (this.#cooldown <= 0) {
                this.#fireForward(game);
                this.#cooldown = this.#fireCooldown;
            }
            this.#wantsToShoot = false;
        }
    }

    takeDamage(amount) {
        this.health = Math.max(this.health - amount, 0);
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    /**
     * 
     * @param {THREE.Vector2} localPoint 
     * @param {number} dt
     */
    #followTarget(localPoint, dt, axis)
    {
        if (axis === 1) {
            this.#camera.position.y = THREE.MathUtils.damp(this.#camera.position.y, localPoint.y, 1, dt);
        }
        else {
            this.#camera.position.x = THREE.MathUtils.damp(this.#camera.position.x, localPoint.x, 1, dt);
        }
        this.#collplane.position.x = this.#camera.position.x;
        this.#collplane.position.y = this.#camera.position.y;
    }

    #moveAirplane(dir, dt) {
        this.#airplane.position.copy(this.#moveTowards(this.#airplane.position, dir, this.#speed * dt));
    }

    #lean(deltaH, maxLean, dt) {

        this.#airplane.rotation.z = THREE.MathUtils.lerp(this.#airplane.rotation.z, THREE.MathUtils.DEG2RAD * (deltaH * maxLean), 1 - 0.01 ** dt);

    }

    #rotateAirplane(delta, dt) {
        
        if (!delta) return;

        this.#aimTarget.position.set(delta.x * 1.2 * 9/16, delta.y * 1.5, 30);

        this.#aimTargetParent.lookAt(this.#aimTarget.position.clone().add(this._object.position));

        const targetQuaternion = this.#aimTargetParent.quaternion.clone();

        this.#airplane.quaternion.slerp(targetQuaternion, 1 - 0.05 ** dt);
    }

    /**
     * 
     * @param {Game} game 
     */
    #fireForward(game) {
        const airplaneWorldPos = new THREE.Vector3();
        this.#airplane.getWorldPosition(airplaneWorldPos);

        game.getRaycaster().setFromCamera(game.getAimNDC(), this.#camera);
        const point = game.getRaycaster().intersectObject(this.#collplane)[0].point;
        const globalCamera = new THREE.Vector3();
        this.#camera.getWorldPosition(globalCamera);
        const dir = point.sub(globalCamera).normalize();
        //const dir = (new THREE.Vector3(0, 0, 1)).applyQuaternion(this.#airplane.quaternion).normalize();

        const spawnPos = airplaneWorldPos.clone().add(dir.clone().multiplyScalar(30));

        const bulletSpeed = 1000;
        const bullet = new Bullet(spawnPos, dir, this.#airplane.position.clone().add(dir), 'player', bulletSpeed);
        game.instantiate(bullet);

        SoundManager.play('shot');
    }
}
