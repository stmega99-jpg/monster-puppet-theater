// Theater stage state machine. It has no audio logic; Task 2 subscribes to 'stagechange' to connect the audio engine.
//
//   closed --open()--> open --close()--> curtain_call --(1.8s)--> closed
//   If open() is called during curtain_call, the bow is cut short and the stage returns to open immediately.

export const CURTAIN_CALL_MS = 1800;

export class Stage extends EventTarget {
  constructor(rootEl) {
    super();
    this.root = rootEl;
    this.state = 'closed';
    this._timer = null;
  }

  _set(next) {
    const prev = this.state;
    this.state = next;
    this.root.dataset.state = next;
    this.dispatchEvent(new CustomEvent('stagechange', { detail: { state: next, prev } }));
  }

  /** Curtain up: open the curtains and light the footlights. */
  open() {
    if (this.state === 'open') return;
    this._clearTimer();
    this._set('open');
  }

  /** Curtain down: play the ~1.8 s curtain call (all puppets bow), then close the curtains. */
  close() {
    if (this.state !== 'open') return;
    this._set('curtain_call');
    this._timer = setTimeout(() => {
      this._timer = null;
      this._set('closed');
    }, CURTAIN_CALL_MS);
  }

  _clearTimer() {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
