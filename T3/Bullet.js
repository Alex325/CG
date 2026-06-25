import { GameObject } from "./GameObject.js";
import * as THREE from 'three';
import { setDefaultMaterial } from '../libs/util/util.js';
import { Game } from "./Game.js";

const geometryEnemy = new THREE.ConeGeometry(6, 20);
const geometryPlayer = new THREE.PlaneGeometry(8, 60);

export class Bullet extends GameObject {
    
    #velocity;
    #speed;
    #ownerType;
    #lifetime = 10;
    #age = 0;
    damage = 5;

    /**
     * @param {THREE.Vector3} position 
     * @param {THREE.Vector3} direction - normalized direction
     * @param {THREE.Vector3} lookAt - point to look at (for correct orientation)
     * @param {string} ownerType - 'player' or 'enemy'
     * @param {number} speed - units per second
     */
    constructor(position, direction, lookAt, ownerType = 'player', speed = 1000) {
        super();

        this.#ownerType = ownerType;
        this.#speed = speed;
        this.#velocity = direction.clone().normalize().multiplyScalar(speed);

    
        const color = ownerType === 'player' ? 'cyan' : 'red';
        const material = new THREE.MeshPhongMaterial({ color: color, shininess: 2000 });
    
        material.side = THREE.DoubleSide;

        const geometry = ownerType === 'player' ? geometryPlayer : geometryEnemy;
        const mesh = new THREE.Mesh(geometry, material);

        mesh.rotateX(THREE.MathUtils.degToRad(90));
        if (ownerType === 'player') {
            mesh.rotateY(THREE.MathUtils.degToRad(90));
        }
    
        this._object.add(mesh);
        this._object.position.copy(position);
        this._object.lookAt(this._object.position.clone().add(direction));

    
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        this.boundingBox.setFromObject(this._object);
    }

    getOwnerType() {
        return this.#ownerType;
    }

    /**
     * 
     * @param {number} dt 
     * @param {Game} game 
     */
    update(dt, game) {
    
        const delta = this.#velocity.clone().multiplyScalar(dt);
        this._object.position.add(delta);

        this.#age += dt;
    
        this.updateBoundingBox();

        if (this.#age > this.#lifetime) {
            game.destroy(this);
        }
    }
}
