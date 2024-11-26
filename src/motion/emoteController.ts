import * as THREE from 'three'
import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm'
import { ExpressionController } from './expressionController'

export class EmoteController {
    private _expressionController: ExpressionController

    constructor(vrm: VRM, camera: THREE.Object3D) {
        this._expressionController = new ExpressionController(vrm, camera)
    }

    public playEmotion(preset: VRMExpressionPresetName) {
        this._expressionController.playEmotion(preset)
    }

    public libSync(preset: VRMExpressionPresetName, value: number) {
        this._expressionController.libSync(preset, value)
    }

    public update(delta: number) {
        this._expressionController.update(delta)
    }
}