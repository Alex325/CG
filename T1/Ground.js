import * as THREE from 'three';
import { createGroundPlaneXZ, setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";

export class Ground extends GameObject {
    constructor() {
        super();

        const planeGeometry = new THREE.PlaneGeometry(2000, 400);
        const planeMaterial = setDefaultMaterial('green');

        const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);

        groundPlane.rotateX(THREE.MathUtils.degToRad(-90));

        this._object.add(groundPlane);
    }
}