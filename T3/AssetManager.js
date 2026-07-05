import * as THREE from 'three';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { AssetManifest } from './AssetManifest.js';

export class AssetManager {

    static manager = new THREE.LoadingManager();

    static models = {};
    static textures = {};
    static audio = {};

    static onProgress = null;
    static onFinished = null;

    static async load() {

        const gltfLoader = new GLTFLoader(this.manager);
        const textureLoader = new THREE.TextureLoader(this.manager);
        const audioLoader = new THREE.AudioLoader(this.manager);

        this.manager.onProgress = (_, loaded, total) => {
            this.onProgress?.(loaded, total);
        };

        const promises = [];

        for (const [name, path] of Object.entries(AssetManifest.models)) {

            promises.push(new Promise((resolve, reject) => {

                gltfLoader.load(
                    path,
                    gltf => {
                        this.models[name] = gltf.scene;
                        resolve();
                    },
                    undefined,
                    reject
                );

            }));
        }

        for (const [name, path] of Object.entries(AssetManifest.textures)) {

            promises.push(new Promise((resolve, reject) => {

                textureLoader.load(
                    path,
                    texture => {
                        this.textures[name] = texture;
                        resolve();
                    },
                    undefined,
                    reject
                );

            }));
        }

        for (const [name, path] of Object.entries(AssetManifest.audio)) {

            promises.push(new Promise((resolve, reject) => {

                audioLoader.load(
                    path,
                    buffer => {
                        this.audio[name] = buffer;
                        resolve();
                    },
                    undefined,
                    reject
                );

            }));
    }

    await Promise.all(promises);
}

}