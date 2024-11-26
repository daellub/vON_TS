import * as THREE from 'three';
import { 
    VRM, 
    VRMExpressionPresetName,
    VRMLoaderPlugin,
    VRMUtils, 
} from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { LipSync } from './lipSync/libSync'
import { EmoteController } from './motion/emoteController';
import { lookat } from './motion/lookat';

export class Model {
    public vrm?: VRM | null
    public mixer?: THREE.AnimationMixer
    public emoteController?: EmoteController

    private _lookAtTargetParent: THREE.Object3D
    private _lipSync?: LipSync

    constructor(lookAtTargetParent: THREE.Object3D) {
        this._lookAtTargetParent = lookAtTargetParent
        this._lipSync = new LipSync(new AudioContext())
    }

    public async loadVRM(url: string): Promise<void> {
        const loader = new GLTFLoader()
        loader.register(
            (parser) =>
                new VRMLoaderPlugin(parser, {
                    lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
                })
        )
    }
}