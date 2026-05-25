import { GameObject } from "./GameObject.js";
import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';

export class Bullet extends GameObject {
    
    #velocity;
    #speed;
    #ownerType; // 'player' or 'enemy'
    #lifetime = 10; // seconds before auto-despawn
    #age = 0;

    /**
     * @param {THREE.Vector3} position 
     * @param {THREE.Vector3} direction - normalized direction
     * @param {string} ownerType - 'player' or 'enemy'
     * @param {number} speed - units per second
     */
    constructor(position, direction, ownerType = 'player', speed = 1000) {
        super();

        this.#ownerType = ownerType;
        this.#speed = speed;
        this.#velocity = direction.clone().normalize().multiplyScalar(speed);

        // create a small sphere as bullet visual
        const geometry = new THREE.SphereGeometry(5, 8, 8);
        const color = ownerType === 'player' ? 'cyan' : 'red';
        const material = setDefaultMaterial(color);
        const mesh = new THREE.Mesh(geometry, material);

        this._object.add(mesh);
        this._object.position.copy(position);

        // bounding box for collision detection (AABB)
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        this.boundingBox.setFromObject(this._object);
    }

    getOwnerType() {
        return this.#ownerType;
    }

    update(dt, game) {
        // move bullet
        const delta = this.#velocity.clone().multiplyScalar(dt);
        this._object.position.add(delta);

        this.#age += dt;

        // update bounding box
        this.updateBoundingBox();

        // auto-despawn after lifetime
        if (this.#age > this.#lifetime) {
            game.destroy(this);
        }
    }
}
