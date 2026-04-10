import * as THREE from 'three';

export class GameObject {
    _object;

    constructor() {
        this._object = new THREE.Object3D();
    }

    getObj() {
        return this._object;
    }

    update(dt, game) {}


}