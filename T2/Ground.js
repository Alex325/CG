import * as THREE from 'three';
import { createGroundPlaneWired, createGroundPlaneXZ, setDefaultMaterial } from "../libs/util/util.js";
import { GameObject } from "./GameObject.js";
import { Tree1, Tree2 } from './Tree.js';
import { Nave } from './Nave.js';
import Grid from '../libs/util/grid.js';
import { perlin2d, simplex2d } from './noise.js';

export class Ground extends GameObject {

    #speed = 800;
    #ngroundplanes = 3;
    /**
     * @type {THREE.Mesh[]}
     */
    #groundplanes = [];
    #treeCount = 100;
    #width = 10000;
    #length = 2000;
    #globalOffsetZ = 0;
    /**
     * @type {THREE.Object3D[]}
     */
    #treePool;

    constructor() {
        super();

        
        const planeMaterial = new THREE.MeshPhongMaterial({
            color: 'green',
            polygonOffset: false,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });
        
        planeMaterial.side = THREE.DoubleSide;
        
        this.#treePool = new Array(this.#treeCount*this.#ngroundplanes);
        
        for (let i = 0; i < this.#treePool.length; i++) {
            const temp = THREE.MathUtils.randInt(0, 1);
            const tree = temp ? new Tree1() : new Tree2();
            const heightFactor = (THREE.MathUtils.seededRandom() - 0.5) * 0.5 + 0.5;
            tree.getObj().scale.set(1, 1, 1 + heightFactor);
            this.#treePool[i] = tree.getObj();
        }
        
        for (let i = 0; i < this.#ngroundplanes; i++) {
            const planeGeometry = new THREE.PlaneGeometry(this.#width, this.#length, 250, 50);
            const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
            groundPlane.receiveShadow = true;
            //groundPlane.add(new Grid(this.#width, this.#length, 50, 10, 'white'))
            groundPlane.rotation.x = THREE.MathUtils.degToRad(-90);
            groundPlane.position.z = i*this.#length;
            groundPlane.userData.number = i;
            groundPlane.userData.spawned = false;
            this.#displace(groundPlane);
            this.#populate(groundPlane);
            // enemies will be spawned later in update(), so they can be associated with Game
            this.#groundplanes.push(groundPlane);
        }
        
        this._object.add(...this.#groundplanes);
        
    }
    
    /**
     * 
     * @param {THREE.Mesh} plane
    */
     #spawnEnemies(plane, game) {
         plane.userData.enemies = plane.userData.enemies || [];

           for (let i = 0; i < 2; i++) {
               const nave = new Nave();
               game.instantiate(nave);

               // compute spawn position at player's current height and at one side of the camera frustum
               const camera = game.getPlayer().getCamera();
               const camWorld = new THREE.Vector3();
               camera.getWorldPosition(camWorld);

               const playerWorld = new THREE.Vector3();
               game.getPlayer().getObj().getWorldPosition(playerWorld);

               const base = new THREE.Vector3();
               plane.getWorldPosition(base);

               // spawn slightly beyond the far edge of the plane (use world coordinates)
               const halfLen = this.#length * 0.5;
               const spawnZ = base.z + halfLen + THREE.MathUtils.randFloat(50, 150);

               // compute frustum width at spawn distance (use world distance)
               const distance = Math.max(1, Math.abs(spawnZ - camWorld.z));
               const vFov = THREE.MathUtils.degToRad(camera.fov);
               const frustumHeight = 2 * Math.tan(vFov / 2) * distance;
               const frustumWidth = frustumHeight * camera.aspect;

               const side = i % 2 === 0 ? -1 : 1; // left, right
               const spawnX = playerWorld.x + side * this.#width * 0.3;
               const spawnY = playerWorld.y;

               const worldPos = new THREE.Vector3(spawnX, spawnY, spawnZ);

               console.log(worldPos);

               nave.getObj().position.copy(worldPos);
               nave.getObj().rotateX(90*THREE.MathUtils.DEG2RAD);
               nave.getObj().rotateY(90*THREE.MathUtils.DEG2RAD);

               // orient the ship container toward the player's current world position at spawn
               nave.getObj().lookAt(playerWorld);
               nave.getObj().scale.multiplyScalar(10);

               // compute end point on the opposite side of the camera and slightly behind it
               const endX = playerWorld.x - side * this.#width * 0.3;
               const endZ = playerWorld.z - 300; // behind camera
               const endPoint = new THREE.Vector3(endX, spawnY, endZ);

               console.log(endPoint);
               

               const dir = endPoint.clone().sub(worldPos).normalize();
               const speed = 600; // units per second

               nave._velocity = dir.multiplyScalar(speed);
               nave._endPoint = endPoint;

               plane.userData.enemies.push(nave);
           }

         plane.userData.spawned = true;
     }

    /**
     * @param {number} x 
     * @param {number} y 
     */
    #noise2d(x, y) {
        return perlin2d(x, y);
    }

    /**
     * 
     * @param {THREE.Mesh} plane 
     */
    #displace(plane) {

        const pos = plane.geometry.attributes.position;

        const vertex = new THREE.Vector3();

        const localX = plane.position.x;
        const localZ = this.#globalOffsetZ;

        for (let i = 0; i < pos.count; i++) {
            vertex.fromBufferAttribute(pos, i);
 
            const x = localX + vertex.x;
            const z = localZ - vertex.y;

            const height = this.#noise2d(x*0.001 + 0.54, z*0.001 + 0.45)*300;
            
            pos.setZ(i, height);

        }

        pos.needsUpdate = true;
        plane.geometry.computeBoundingBox();
        plane.updateMatrixWorld(true);
        this.#globalOffsetZ += this.#length;
        

    }

    /**
     * 
     * @param {THREE.Mesh} plane 
     */
    #populate(plane) {

        const placed = [];

        for (let i = 0; i < this.#treeCount; i++) {
            let attempts = 0;
            let valid = false;
            let x, y, z, tree, radius;

            while (!valid && attempts < 50) {
                attempts++;

                const vertexi = THREE.MathUtils.randInt(0, plane.geometry.attributes.position.count - 1);
                const vertex = new THREE.Vector3();

                vertex.fromBufferAttribute(plane.geometry.attributes.position, vertexi);

                ({x, y, z} = vertex);

                radius = 150; 
                
                valid = true;
                
                for (const p of placed) {
                    const dx = x - p.x;
                    const dy = y - p.y;
                    
                    const minDist = (radius + p.radius) / 2;
                    
                    if (dx * dx + dy * dy < minDist * minDist) {
                        valid = false;
                        break;
                    }
                }
            }
            
            if (!valid) continue;

            placed.push({ x, y, radius });

            tree = this.#treePool.pop();
            
            tree.position.set(x, y, z + 25*tree.scale.y);

            plane.add(tree);
        }

    }

    /**
     * 
     * @param {THREE.Mesh} plane 
     */
    #reclaimTrees(plane) {
        this.#treePool.push(...plane.children);
        plane.remove(...plane.children);
    }

    #reclaimEnemies(plane, game) {
        if (!plane.userData || !plane.userData.enemies) return;

        for (const enemy of plane.userData.enemies) {
            game.destroy(enemy);
        }

        plane.userData.enemies = [];
        plane.userData.spawned = false;
    }

    #rotatePlanes(game) {

        this._object.position.z = 0;

        const first = this.#groundplanes.shift();
        this.#groundplanes.push(first);


        for (let i = 0; i < this.#groundplanes.length; i++) {
            this.#groundplanes[i].position.z = i*this.#length;
        }

        this.#displace(first);
        this.#reclaimTrees(first);
        this.#reclaimEnemies(first, game);
        this.#populate(first);

    }

    update(dt, game) {

        this._object.translateZ(-this.#speed*dt);

        if (this._object.position.z < -(0 + this.#length))
            this.#rotatePlanes(game);

        // Spawn enemies for planes that don't have them yet (ensures we have access to Game)
        for (const plane of this.#groundplanes) {
            if (!plane.userData.spawned) {
                this.#spawnEnemies(plane, game);
            }
        }

    }
}