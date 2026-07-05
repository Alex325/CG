import { GameObject } from "./GameObject.js";
import * as THREE from 'three';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { Bullet } from './Bullet.js';
import { Game } from "./Game.js";

export class Nave extends GameObject {
    #fireTimer = 0;
    #fireInterval = 1;
    #fading = false;
    #fadeTime = 0.5;
    #fadeElapsed = 0;

    constructor() {
        super();

        const loader = new GLTFLoader();

        loader.load('./assets/nave.glb', (gltf) => {

            const model = gltf.scene;

            this._object.add(model);
        });
    }

    /**
     * 
     * @param {number} dt 
     * @param {Game} game 
     * @returns 
     */
    update(dt, game) {
        if (this.#fading) {
            this.#fadeElapsed += dt;
            const alpha = 1 - (this.#fadeElapsed / this.#fadeTime);
            this.#setOpacity(Math.max(0, alpha));
            if (this.#fadeElapsed >= this.#fadeTime) {
                game.destroy(this);
            }

            return;
        }
        
        const player = game.getPlayer && game.getPlayer();
        if (!player) return;

        const playerPos = new THREE.Vector3();
        player.getObj().children[2].getWorldPosition(playerPos);

        const obj = this.getObj();
        if (!obj) return;


        if (this._velocity) {
            const delta = this._velocity.clone().multiplyScalar(dt);
            obj.position.add(delta);
        }

        const objWorld = new THREE.Vector3();
        obj.getWorldPosition(objWorld);

        this.#fireTimer += dt;
        if (this.#fireTimer >= this.#fireInterval && objWorld.z > 0) {
            this.#fireTimer = 0;
            this.#fireAtPlayer(game, playerPos);
        }


        if (objWorld.z < -500) {                
            game.destroy(this);
        }
    }

    isFading() {
        return this.#fading;
    }

    fadeOut() {
        if (this.#fading) return;
        this.#fading = true;
        this.#fadeElapsed = 0;
        const material = this._object.children[0].children[0].material;
        material.transparent = true;
    }

    /**
     * 
     * @param {number} alpha 
     */
    #setOpacity(alpha) {
        const material = this._object.children[0].children[0].material;
        material.transparent = true;
        material.opacity = alpha;
        material.needsUpdate = true;

    }

    #fireAtPlayer(game, playerPos) {
        const objPos = this._object.position.clone();
        const dirToPlayer = playerPos.clone().sub(objPos).normalize();

        const bulletSpeed = 700;

        const bulletDir = dirToPlayer.clone();        

        const bullet = new Bullet(objPos.clone(), bulletDir, playerPos, 'enemy', bulletSpeed);
        game.instantiate(bullet);
    }
}

