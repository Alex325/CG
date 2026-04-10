import * as THREE from 'three';
import { createGroundPlaneXZ, setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";

export class Ground extends GameObject {
    constructor() {
        super();

        const planeGeometry = new THREE.PlaneGeometry(400, 200);
        const planeMaterial = setDefaultMaterial('green');

        const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);

        this._object.add(groundPlane);
    }
}