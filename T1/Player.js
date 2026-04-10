import { GameObject } from './GameObject.js';
import { setDefaultMaterial } from '../libs/util/util.js';
import * as THREE from 'three';

export class Player extends GameObject {

    constructor() {
        super();
        
        const cubeGeometry = new THREE.BoxGeometry(20, 20, 20);
        const cubeMaterial = setDefaultMaterial('red');

        this._object.add(new THREE.Mesh(cubeGeometry, cubeMaterial));
        

    }
}