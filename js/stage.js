// 劇場ステージの状態機械。音声処理は持たない（Task 2 が 'stagechange' を購読して接続する）。
//
//   closed --open()--> open --close()--> curtain_call --(1.8s)--> closed
//   curtain_call 中に open() された場合は、お辞儀を打ち切って即座に open へ戻る。

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

  /** 開演: カーテンを開き、フットライトを点灯する。 */
  open() {
    if (this.state === 'open') return;
    this._clearTimer();
    this._set('open');
  }

  /** 閉演: 約1.8秒のカーテンコール（一斉お辞儀）の後にカーテンを閉じる。 */
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
