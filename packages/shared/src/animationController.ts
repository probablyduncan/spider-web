type AnimationCallback = (state: { timestamp: DOMHighResTimeStamp, delta: DOMHighResTimeStamp }) => boolean;

export class AnimationController {

    private _prevTimestamp?: DOMHighResTimeStamp;
    private readonly _animationCallback: AnimationCallback;

    /**
     * @param animationCallback callback which is run on each frame. Should return true if animation should continue, and false if animation is complete and should not keep looping.
    */
    constructor(animationCallback: AnimationCallback) {
        this._animationCallback = animationCallback;
    }

    isRunning: boolean = false;

    playIfPaused() {
        if (!this.isRunning) {
            this._queueFrame();
        }
    }

    pause() {
        if (this.isRunning) {
            this._cleanup();
        }
    }

    toggle() {
        this.isRunning ? this._cleanup() : this._queueFrame();
    }

    private _queueFrame() {
        this.isRunning = true;
        requestAnimationFrame(this._frameCallback);
    }

    private _cleanup() {
        this.isRunning = false;
        this._prevTimestamp = undefined;
    }

    private _frameCallback: FrameRequestCallback = (timestamp: DOMHighResTimeStamp) => {
        if (!this.isRunning) {
            return;
        }

        const delta = this._prevTimestamp ? timestamp - this._prevTimestamp : 0;
        this._prevTimestamp = timestamp;

        if (delta <= 0 || this._animationCallback({ delta, timestamp })) {
            this._queueFrame();
        } else {
            this._cleanup();
        }
    }
}