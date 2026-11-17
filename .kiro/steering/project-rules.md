# Steering Rules: Jack-o'-Lantern Synth: Monster Puppet Session

> **正本規定 (Single Source of Truth)**: 本プロジェクトの仕様は `.kiro/specs/monster-ensemble/` 配下の `requirements.md`, `design.md`, `tasks.md` を唯一の正本とする。

## 1. 技術スタック・依存関係の制約
- **ゼロ外部API・完全クライアント完結**: サーバー通信、外部APIキー、外部音源ファイル（mp3/wav等の読み込み）は一切使用しない。すべての音はブラウザ標準の `Web Audio API` で合成し、すべてのビジュアルは `HTML5 Canvas` またはインライン `SVG` + `CSS` で描画する。
- **最小構成**: Vanilla HTML/CSS/JS（ES Modules）または最小限のVite構成とし、外部UIライブラリやhtml2canvas等は使用しない。

## 2. 音響・アニメーション・停止処理の絶対ルール
- **和声進行の厳守**: 2小節（32ステップ）のコード進行（`Cm -> Ab -> Fm -> G7`）を全トラック共通の和声マップとして参照し、どのパーツの組み合わせでも不協和音を起こさないこと。
- **全トラック統一スウィングと時刻共有**: スウィング遅延 `swingOffset` を加算した `scheduledTime = baseStepTime + swingOffset` を算出し、音源ノードの発音予約とアニメーション用の `visualQueue` の**両方**に必ず同一の `scheduledTime` を渡すこと。
- **出力時刻基準の同期 (`getOutputTimestamp`)**: 描画ループでの現在時刻取得には `audioCtx.getOutputTimestamp().contextTime`（0または未定義時は `audioCtx.currentTime` にフォールバック）を使用し、予約時ではなく実際の音声出力時刻を基準にアニメーションを発火させること。
- **経過時間ベースの指数減衰**: モーション強度 `energy` はフレーム数に依存させず、経過時間 $\Delta t$ から `Math.exp(-dt / tau)` で算出すること。
- **完全な停止・破棄処理**: 停止（Stop）時はスケジューラタイマーを破棄するだけでなく、スケジュール済みの全音源ノードを `activeNodes` セットから即座に `.stop()` & `.disconnect()` し、`visualQueue` を空にして再開時の二重演奏を確実に防ぐこと。
- **シームレスループWAV**: WAV出力時はディレイ等の残響がループ境界で途切れないよう、`OfflineAudioContext` で2ループ分（64ステップ）をレンダリングし、残響が乗った後半1ループ分（後半32ステップ）のバッファのみを切り出してWAV化すること。
