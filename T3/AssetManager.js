import * as THREE from 'three';

export class AssetManager {

    static manager = new THREE.LoadingManager();

    static loaded = 0;
    static total = 0;

    static onProgress = null;
    static onFinished = null;

}

AssetManager.manager.onStart = (_, loaded, total) => {
    AssetManager.loaded = loaded;
    AssetManager.total = total;

    AssetManager.onProgress?.(loaded, total);
};

AssetManager.manager.onProgress = (_, loaded, total) => {
    AssetManager.loaded = loaded;
    AssetManager.total = total;

    AssetManager.onProgress?.(loaded, total);
};

AssetManager.manager.onLoad = () => {
    AssetManager.onFinished?.();
};