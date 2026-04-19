import { setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";
import * as THREE from 'three';

export class Tree1 extends GameObject {

    trunkHeight = 30;

    constructor() {
        super();

        const trunkGeometry = new THREE.CylinderGeometry(20, 20, this.trunkHeight);
        const trunkMaterial = setDefaultMaterial('brown');
        const leavesGeometry = new THREE.ConeGeometry(50, 40, 15);
        const leavesMaterial = setDefaultMaterial('limegreen');

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        const leaves1 = new THREE.Mesh(leavesGeometry, leavesMaterial);
        const leaves2 = new THREE.Mesh(leavesGeometry, leavesMaterial);
        const leaves3 = new THREE.Mesh(leavesGeometry, leavesMaterial);

        trunk.add(leaves1);
        leaves1.add(leaves2);
        leaves2.add(leaves3);

        trunk.rotateX(THREE.MathUtils.degToRad(90));
        leaves1.translateY(40);
        leaves2.translateY(20);
        leaves3.translateY(20);

        this._object.add(trunk);
    }
}

export class Tree2 extends GameObject {

    trunkHeight = 30;


    constructor() {
        super();

        const trunkGeometry = new THREE.CylinderGeometry(20, 20, this.trunkHeight);
        const trunkMaterial = setDefaultMaterial('brown');
        const leavesGeometry = new THREE.SphereGeometry(40);
        const leavesMaterial = setDefaultMaterial('limegreen');

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);

        trunk.add(leaves);
        
        trunk.rotateX(THREE.MathUtils.degToRad(90));
        leaves.translateY(50);

        this._object.add(trunk);
    }
}