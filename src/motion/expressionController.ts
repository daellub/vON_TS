import * as THREE from 'three';
import {
    VRM,
    VRMExpressionManager,
    VRMExpressionPresetName,
} from '@pixiv/three-vrm'
import { lookat } from './lookat'
import { blink } from './blink'

export class ExpressionController {
    private _autoLookAt: lookat
    private _autoBlink?: blink
    private _expressionManager?: VRMExpressionManager
    private _currentEmotion: VRMExpressionPresetName
    private _currentLipSync: {
        preset: VRMExpressionPresetName
        value: number
    } | null
    constructor(vrm: VRM, camera: THREE.Object3D) {
        this._autoLookAt = new lookat(vrm, camera)
        this._currentEmotion = 'neutral'
        this._currentLipSync = null
        if (vrm.expressionManager) {
            this._expressionManager = vrm.expressionManager
            this._autoBlink = new blink(vrm.expressionManager)
        }
    }

    public playEmotion(preset: VRMExpressionPresetName) {
        if (this._currentEmotion != 'neutral') {
            this._expressionManager?.setValue(this._currentEmotion, 0)
        }

        if (preset == 'neutral') {
            this._autoBlink?.setEnable(true)
            this._currentEmotion = preset
            return
        }

        const t = this._autoBlink?.setEnable(false) || 0
        this._currentEmotion = preset
        setTimeout(() => {
            this._expressionManager?.setValue(preset, 1)
        }, t * 1000)
    }

    public libSync(preset: VRMExpressionPresetName, value: number) {
        if (this._currentLipSync) {
            this._expressionManager?.setValue(this._currentLipSync.preset, 0)
        }
        this._currentLipSync = {
            preset,
            value,
        }
    }

    public update(delta: number) {
        if (this._autoBlink) {
            this._autoBlink.update(delta)
        }

        if (this._currentLipSync) {
            const weight =
                this._currentEmotion === 'neutral'
                 ? this._currentLipSync.value * 0.5
                 : this._currentLipSync.value * 0.25
            this._expressionManager?.setValue(this._currentLipSync.preset, weight)
        }
    }
}