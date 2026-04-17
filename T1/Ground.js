import * as THREE from 'three';
import { createGroundPlaneXZ, setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";

export class Ground extends GameObject {
    constructor() {
        super();

        const [width, length] = [10000, 2000];

        const planeGeometry = new THREE.PlaneGeometry(width, length);
        const planeMaterial = setDefaultMaterial('green');
        planeMaterial.wireframe = true;

        const groundPlane1 = new THREE.Mesh(planeGeometry, planeMaterial);
        const groundPlane2 = new THREE.Mesh(planeGeometry, planeMaterial);
        const groundPlane3 = new THREE.Mesh(planeGeometry, planeMaterial);

        groundPlane1.rotateX(THREE.MathUtils.degToRad(-90));
        groundPlane2.rotateX(THREE.MathUtils.degToRad(-90));
        groundPlane3.rotateX(THREE.MathUtils.degToRad(-90));

        groundPlane2.translateY(-length);
        groundPlane3.translateY(-2*length);

        

        this._object.add(groundPlane1);
        this._object.add(groundPlane2);
        this._object.add(groundPlane3);


    }

    update(dt, game) {

    }
}