import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const LOGO_URL = '/logo.stl';

/**
 * Charge logo.stl une seule fois ; chaque viewer clone la géométrie.
 */
@Injectable({ providedIn: 'root' })
export class LogoStlCacheService {
  private geometryPromise?: Promise<THREE.BufferGeometry>;

  load(): Promise<THREE.BufferGeometry> {
    if (!this.geometryPromise) {
      this.geometryPromise = new Promise((resolve, reject) => {
        const loader = new STLLoader();
        loader.load(
          LOGO_URL,
          (geometry) => {
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            if (box) {
              const center = new THREE.Vector3();
              box.getCenter(center);
              geometry.translate(-center.x, -center.y, -center.z);
            }
            geometry.computeBoundingSphere();
            resolve(geometry);
          },
          undefined,
          (err) => reject(err),
        );
      });
    }
    return this.geometryPromise.then((geo) => geo.clone());
  }
}
