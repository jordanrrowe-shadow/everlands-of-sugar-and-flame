// One shared model loader. Sculpted models keep full-resolution textures in a GPU-compressed form (KTX2),
// which a phone or tablet holds in a fraction of the memory of an ordinary image.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ktx2 = new KTX2Loader().setTranscoderPath('basis/');
export const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx2);
export function initGltf(renderer) { ktx2.detectSupport(renderer); }
