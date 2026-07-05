import * as THREE from 'three';
import { Game } from './Game.js';

export class GameObject {
    _object;

    constructor() {
        this._object = new THREE.Object3D();
    }

    getObj() {
        return this._object;
    }

    /**
     * 
     * @param {number} dt 
     * @param {Game} game 
     */
    update(dt, game) {}


}