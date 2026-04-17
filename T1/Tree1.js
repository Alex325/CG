import { setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";
import * as THREE from 'three';

export class Tree1 extends GameObject {
    constructor() {
        const trunkGeometry = new THREE.CylinderGeometry(10, 10, 50);
        const trunkMaterial = setDefaultMaterial('brown');

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

        this._object.add(trunk);
    }
}