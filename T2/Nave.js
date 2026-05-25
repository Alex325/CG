import { GameObject } from "./GameObject.js";
import * as THREE from 'three';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { Bullet } from './Bullet.js';

export class Nave extends GameObject {
    #fireTimer = 0;
    #fireInterval = 1; // fire every 1 second

    constructor() {
        super();

        const loader = new GLTFLoader();

        loader.load('./assets/nave.glb', (gltf) => {

            const model = gltf.scene;

            this._object.add(model);
        });
    }

    update(dt, game) {
        try {
            const player = game.getPlayer && game.getPlayer();
            if (!player) return;

            const playerPos = new THREE.Vector3();
            player.getObj().getWorldPosition(playerPos);

            const obj = this.getObj();
            if (!obj) return;

            // Orient the ship toward the player's world position
            obj.lookAt(playerPos);

            // Move with constant velocity if set
            if (this._velocity) {
                const delta = this._velocity.clone().multiplyScalar(dt);
                obj.position.add(delta);
            }

            // Fire bullets at player every 1 second
            this.#fireTimer += dt;
            if (this.#fireTimer >= this.#fireInterval) {
                this.#fireTimer = 0;
                this.#fireAtPlayer(game, playerPos);
            }

            // Despawn when the ship moves behind the camera (use camera forward projection)
            const cam = game.getPlayer().getCamera();
            const camWorld = new THREE.Vector3();
            cam.getWorldPosition(camWorld);

            const camDir = new THREE.Vector3();
            cam.getWorldDirection(camDir);

            const objWorld = new THREE.Vector3();
            obj.getWorldPosition(objWorld);

            // projection of vector (cam -> obj) onto camera forward direction
            const toObj = objWorld.clone().sub(camWorld);
            const forwardDist = toObj.dot(camDir);

            // if forwardDist is negative and sufficiently behind, destroy
            // increase threshold so enemies are not removed too early
            if (objWorld.z < -300) {
                game.destroy(this);
            }
            
        }
        catch (e) {
            // ignore errors during lookAt
        }
    }

    #fireAtPlayer(game, playerPos) {
        const objPos = this._object.position.clone();
        const dirToPlayer = playerPos.clone().sub(objPos).normalize();

        // fire a cone of 3 bullets spread around the direction
        const spreadAngle = THREE.MathUtils.degToRad(15); // 15 degrees spread
        const bulletSpeed = 400;

        // create 3 bullets in a cone
        for (let i = -1; i <= 1; i++) {
            const offset = i * spreadAngle;
            const rotAxis = new THREE.Vector3(0, 1, 0); // rotate around Y
            const bulletDir = dirToPlayer.clone();
            
            // apply rotation offset
            const quat = new THREE.Quaternion();
            quat.setFromAxisAngle(rotAxis, offset);
            bulletDir.applyQuaternion(quat);

            const bullet = new Bullet(objPos.clone(), bulletDir, 'enemy', bulletSpeed);
            game.instantiate(bullet);
        }
    }
}
