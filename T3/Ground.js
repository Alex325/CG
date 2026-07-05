import * as THREE from 'three';
import { GameObject } from "./GameObject.js";
import { Tree1, Tree2 } from './Tree.js';
import { Nave } from './Nave.js';
import { perlin2d } from './noise.js';
import { AssetManager } from './AssetManager.js';

const groundFragmentShader = `
    in vec2 vUv;
    in float vHeight;
    uniform sampler2D uGrass;
    uniform sampler2D uSand;
    uniform sampler2D uPebbles;

    #include <fog_pars_fragment>

    void main() {

        vec4 sandColor = texture2D(uSand, vUv*4.0);
        vec4 grassColor = texture2D(uGrass, vUv*8.0);
        vec4 pebblesColor = texture2D(uPebbles, vUv*20.0);

        float mixsp = smoothstep(-40.0, 50.0, vHeight);
        float mixpg = smoothstep(50.0, 200.0, vHeight);

        vec4 finalColor = mix(sandColor, pebblesColor, mixsp);
        finalColor = mix(finalColor, grassColor, mixpg);

        if (vHeight < -45.0) discard;

        gl_FragColor = finalColor;

        #include <fog_fragment>
    }`;

const groundVertexShader = `
    out vec2 vUv;
    out float vHeight;
    
    #include <fog_pars_vertex>
    
    void main() {
        vUv = uv;
        vHeight = position.z;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        gl_Position = projectionMatrix * mvPosition;
        
        #include <fog_vertex>
    }`;

const waterVertexShader = `
    out vec2 vUv;
    out vec3 vWorldPos;

    #include <fog_pars_vertex>

    void main() {

        vUv = uv;

        vec4 mPosition = modelMatrix * vec4(position.xyz, 1.0);

        vWorldPos = mPosition.xyz;
        
        vec4 mvPosition = viewMatrix * mPosition;

        gl_Position = projectionMatrix * mvPosition;

        #include <fog_vertex>
    }`;

const waterFragmentShader = `
    uniform sampler2D normalMap;

    uniform float time;

    uniform vec3 lightDirection;
    uniform vec3 waterColor;
    uniform vec3 sunColor;

    in vec2 vUv;
    in vec3 vWorldPos;
    
    #include <fog_pars_fragment>
    
    void main() {

        vec2 uv1 = vUv + vec2(time * 0.03, time * 0.02);
        vec2 uv2 = vUv + vec2(-time * 0.015, time * 0.025);
        vec2 uv3 = vUv + vec2(time * 0.0023, time * 0.032);
        vec2 uv4 = vUv + vec2(-time * 0.001, time * 0.05);

        vec3 n1 = texture(normalMap, uv1).xyz * 2.0 - 1.0;
        vec3 n2 = texture(normalMap, uv2).xyz * 2.0 - 1.0;
        vec3 n3 = texture(normalMap, uv3).xyz * 2.0 - 1.0;
        vec3 n4 = texture(normalMap, uv4).xyz * 2.0 - 1.0;

        vec3 normal = normalize(n1 + n2 + n3 + n4);

        float diffuse = max(dot(normal, normalize(lightDirection)), 0.0);

        vec3 viewDir = -normalize(cameraPosition - vWorldPos);

        vec3 halfDir = normalize(viewDir + normalize(lightDirection));

        float specular = pow(max(dot(normal, halfDir), 0.0), 50.0);

        float fresnel = pow(1.0 - max(dot(viewDir, normal),0.0), 5.0);


        vec3 color = waterColor;
        color *= 0.4 + diffuse * 0.6;
        color += sunColor * specular * 2.8;
        color = mix(color, sunColor, fresnel * 0.1);

        gl_FragColor = vec4(color, 1.0);
        
        #include <fog_fragment>
    }`;

export class Ground extends GameObject {

    #speed = 800;
    #ngroundplanes = 3;
    /**
     * @type {THREE.Mesh[]}
     */
    #groundplanes = [];
    /**
     * @type {THREE.Water[]}
     */
    #waterplanes = [];

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

        AssetManager.textures.grass.wrapS = AssetManager.textures.grass.wrapT = THREE.RepeatWrapping;
        AssetManager.textures.sand.wrapS = AssetManager.textures.sand.wrapT = THREE.RepeatWrapping;
        AssetManager.textures.pebbles.wrapS = AssetManager.textures.pebbles.wrapT = THREE.RepeatWrapping;
        AssetManager.textures.waterNormals.wrapS = AssetManager.textures.waterNormals.wrapT = THREE.RepeatWrapping;

        AssetManager.textures.grass.repeat.set(20, 20);
        AssetManager.textures.sand.repeat.set(20, 20);
        AssetManager.textures.pebbles.repeat.set(20, 20);
        AssetManager.textures.waterNormals.repeat.set(20, 20);

        AssetManager.textures.grass.needsUpdate = true;
        AssetManager.textures.sand.needsUpdate = true;
        AssetManager.textures.pebbles.needsUpdate = true;
        AssetManager.textures.waterNormals.needsUpdate = true;

        const myUniforms = {
            uGrass: {value: AssetManager.textures.grass},
            uSand: {value: AssetManager.textures.sand},
            uPebbles: {value: AssetManager.textures.pebbles}
        };

        const planeMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib['fog'], myUniforms]),
            vertexShader: groundVertexShader,
            fragmentShader: groundFragmentShader,
            fog: true,
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
            groundPlane.rotation.x = THREE.MathUtils.degToRad(-90);
            groundPlane.position.z = i*this.#length;
            groundPlane.userData.number = i;
            groundPlane.userData.spawned = false;
            groundPlane.renderOrder = 1;
            this.#displace(groundPlane);
            this.#populate(groundPlane);
            this.#waterplanes.push(this.#createWater(i));
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
               const playerWorld = new THREE.Vector3();
               game.getPlayer().getObj().getWorldPosition(playerWorld);

               const base = new THREE.Vector3();
               plane.getWorldPosition(base);

               const halfLen = this.#length * 0.5;
               const spawnZ = base.z + halfLen + THREE.MathUtils.randFloat(50, 150);

               const side = i % 2 === 0 ? -1 : 1;
               const spawnX = playerWorld.x + side * this.#width * 0.2;
               const spawnY = playerWorld.y + THREE.MathUtils.randFloat(-150, 150);

               const spawnPos = new THREE.Vector3(spawnX, spawnY, spawnZ);

               nave.getObj().position.copy(spawnPos);
               nave.getObj().scale.multiplyScalar(10);
               
               const endX = -side * 500;
               const endZ = -500;
               const endPoint = new THREE.Vector3(endX, spawnY, endZ);
               nave.getObj().lookAt(endPoint);
               

               const dir = endPoint.clone().sub(spawnPos).normalize();
               const speed = 600;

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

            const height = this.#noise2d(x*0.001 + 0.54, z*0.001 + 0.45)*500;
            
            pos.setZ(i, height);

        }

        pos.needsUpdate = true;
        plane.geometry.computeBoundingBox();
        plane.geometry.computeVertexNormals();
        plane.geometry.computeBoundingSphere();
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
                
                if (z < 50.0)
                {
                    valid = false;
                    break;
                }

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
    #createWater(i) {
            const waterGeometry = new THREE.PlaneGeometry(this.#width, this.#length, 256, 256);
        
            const waterMaterial = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog,
                {
                    time: { value: 0.0 },
                    normalMap: { value: AssetManager.textures.waterNormals },
                    lightDirection: {
                        value: new THREE.Vector3(0.3, 1.0, 0.4).normalize()
                    },
                    waterColor: {
                        value: new THREE.Color(0x2d6f87)
                    },
                    sunColor: {
                        value: new THREE.Color(0xfff9e8)
                    }
                }]),
                vertexShader: waterVertexShader,
                fragmentShader: waterFragmentShader,
                fog: true,
            });

            const water = new THREE.Mesh(waterGeometry, waterMaterial);

            water.rotation.x = THREE.MathUtils.degToRad(-90);
            water.position.set(0, -50, i * this.#length);

            this._object.add(water);
            return water;
    }

    /**
     * 
     * @param {THREE.Mesh} plane 
     */
    #reclaimTrees(plane) {
        this.#treePool.push(...plane.children);
        plane.remove(...plane.children);
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
        this.#spawnEnemies(first, game);
        this.#populate(first);

    }

    /**
     * 
     * @param {number} dt 
     * @param {Game} game 
     */
    update(dt, game) {

        for (const water of this.#waterplanes) {
            water.material.uniforms.time.value += dt;
        }

        this._object.translateZ(-this.#speed*dt);

        if (this._object.position.z < -(0 + this.#length))
            this.#rotatePlanes(game);

        for (const plane of this.#groundplanes) {
            if (!plane.userData.spawned) {
                this.#spawnEnemies(plane, game);
            }
        }

    }
}