import { LipSyncAnalyzeResult } from "./analyze";

const TIME_DOMAIN_DATA_LENGTH = 2048

export class LipSync {
    public readonly audio: AudioContext
    public readonly analyser: AnalyserNode
    public readonly timeDomainData: Float32Array

    public constructor(audio: AudioContext) {
        this.audio = audio

        this.analyser = audio.createAnalyser()
        this.timeDomainData = new Float32Array(TIME_DOMAIN_DATA_LENGTH)
    }

    public update(): LipSyncAnalyzeResult {
        this.analyser.getFloatTimeDomainData(this.timeDomainData)

        let volume = 0.0
        for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
            volume = Math.max(volume, Math.abs(this.timeDomainData[i]))
        }

        volume = 1 / (1 + Math.exp(-45 * volume + 5))
        if (volume < 0.1) volume = 0

        return {
            volume,
        }
    }

    public async playFromArrayBuffer(
        buffer: ArrayBuffer,
        onEnded?: () => void,
        isNeedDecode: boolean = true,
        sampleRate: number = 24000
    ) {
        try {
            if (!(buffer instanceof ArrayBuffer)) {
                throw new Error('[!] 입력 버퍼 형식이 올바르지 않습니다.')
            }

            if (buffer.byteLength === 0) {
                throw new Error('[!] 입력 버퍼가 비어있습니다.')
            }

            let audioBuffer: AudioBuffer

            if (!isNeedDecode) {
                const pcmData = new Int16Array(buffer)

                const floatData = new Float32Array(pcmData.length)
                for (let i = 0; i < pcmData.length; i++) {
                    floatData[i] =
                        pcmData[i] < 0 ? pcmData[i] / 32768.0 : pcmData[i] / 32767.0
                }

                audioBuffer = this.audio.createBuffer(1, floatData.length, sampleRate)
                audioBuffer.getChannelData(0).set(floatData)
            } else {
                try {
                    audioBuffer = await this.audio.decodeAudioData(buffer)
                } catch (decodeError) {
                    console.error('[!] 오디오 데이터 복호화를 실패했습니다: ', decodeError)
                    throw new Error('[!] 오디오 데이터 복호화를 실패했습니다.')
                }
            }

            const bufferSource = this.audio.createBufferSource()
            bufferSource.buffer = audioBuffer

            bufferSource.connect(this.audio.destination)
            bufferSource.connect(this.analyser)
            bufferSource.start()
            if (onEnded) {
                bufferSource.addEventListener('ended', onEnded)
            }
        } catch (error) {
            console.error('[!] 오디오 재생을 실패했습니다: ', error)
            if (onEnded) {
                onEnded()
            }
        }
    }

    public async playFromURL(url: string, onEnded?: () => void) {
        const res = await fetch(url)
        const buffer = await res.arrayBuffer()
        this.playFromArrayBuffer(buffer, onEnded)
    }

    private detectPCM16(buffer: ArrayBuffer): boolean {
        if (buffer.byteLength % 2 !== 0) {
            return false
        }

        const int16Array = new Int16Array(buffer)
        let isWithinRange = true
        for (let i = 0; i < Math.min(1000, int16Array.length); i++) {
            if (int16Array[i] < -32768 || int16Array[i] > 32767) {
                isWithinRange = false
                break
            }
        }

        let nonZeroCount = 0
        for (let i = 0; i < Math.min(1000, int16Array.length); i++) {
            if (int16Array[i] !== 0) {
                nonZeroCount++
            }
        }

        const hasReasonableDistribution =
            nonZeroCount > Math.min(1000, int16Array.length) * 0.1
        
            return isWithinRange && hasReasonableDistribution
    }
}