import { setDefaultMaterial } from '../libs/util/util.js';
import { GameObject } from './GameObject.js';
import * as THREE from 'three';

export class Cube extends GameObject {

    constructor(side) {
        super();

        const cubeGeometry = new THREE.BoxGeometry(side, side, side);
        const cubeMaterial = setDefaultMaterial('red');

        this._object.add(new THREE.Mesh(cubeGeometry, cubeMaterial));
    }

    update(dt) {
    }

}