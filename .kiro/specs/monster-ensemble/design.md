# Technical Design: Monster Puppet Session

## 1. 美術・世界観パレット（Antique Wood & Faded Storybook）
- 蛍光色を排し、アンティーク木彫りパペットと色褪せた絵本の質感をCSS変数とCanvas/SVG描画で統一する：
  - `--bg-stage-dark: #1A1412`, `--wood-frame: #4A3228`, `--wood-highlight: #6E4B3A`, `--brass-accent: #C5A059`
  - `--curtain-red: #6B1D2F`, `--curtain-shadow: #3D0E19`, `--parchment-bg: #F2E6D0`, `--sepia-ink: #2C1E18`
  - パペット基本色: Pumpkin `#D97236` (Candle `#F7C873`), Skeleton `#E8DCC4` (Shadow `#B5A48B`), Cauldron `#2B303A` (Bubble `#76A884`), Ghost `#EAE6DF` (Blush `#D98A82`)
- 各パペット上部には細い麻の操り糸（`rgba(212, 195, 163, 0.35)`）を描画する。

## 2. 全36種類の外見パーツ＆音色パラメータ定義
- **🎃 かぼちゃ（Lead Synth / Gain `0.26`）**:
  - Slot A (目/音色): `0: 三日月目` (`triangle`+Sub `sine`, LPF `1400Hz`), `1: 木製ボタン目` (`square`, LPF `1800Hz`, Q `2.5`), `2: 星くり抜き目` (Detuned `sawtooth` ±8c, LPF `2600Hz`)
  - Slot B (鼻/フレーズ): `0: 三角彫り鼻` (Clockwork Polka), `1: くるりん蔓鼻` (Ghostly Shuffle), `2: 逆さハート鼻` (Cabaret Tango)
  - Slot C (口/奏法): `0: ギザギザ笑顔` (Staccato Decay `0.16s`), `1: おちょぼ丸口` (Vibrato 5.5Hz, Decay `0.38s`), `2: ニヤリ八重歯` (Portamento Glide, Decay `0.26s`)
- **💀 骸骨（Drums & Bone Marimba / Kick `0.30`, Snare `0.16`, Rib `0.18`）**:
  - Slot A (頭/ドラム音質): `0: 折れシルクハット` (Wood Kick `110->45Hz` + Brush Snare), `1: ぜんまいネジ頭` (Toy Kick `140->55Hz` + Snappy Snare), `2: ブリキ王冠` (Deep Kick `90->38Hz` + Rim Clap)
  - Slot B (肋骨/ビート): `0: 4つ箱あばら` (Clockwork Polka), `1: 真鍮継ぎあばら` (Ghostly Shuffle), `2: 蜘蛛の巣あばら` (Cabaret Tango)
  - Slot C (バチ/木琴音色): `0: 大腿骨マレット` (Warm Marimba `sine`+4倍音), `1: 銀のスプーン` (Glassy Xylophone `triangle`+3倍音), `2: 枯れ枝タクト` (Wood Clack バンドパス木琴)
- **🧪 魔女の大釜（Acid Bubble Bass / Gain `0.28`）**:
  - Slot A (釜/波形): `0: 猫足の黒鉄釜` (`sawtooth`, LPF `280Hz`, Q `3.0`), `1: 真鍮ツギハギ釜` (`square`, EnvLPF `160->850Hz`, Q `8.0`), `2: ひび割れ陶器釜` (`triangle`+Sub, LPF `400Hz`, Q `2.0`)
  - Slot B (具材/パターン): `0: 光る毒キノコ` (Clockwork Polka), `1: ぜんまいカエル` (Ghostly Shuffle), `2: 星空の目玉` (Cabaret Tango)
  - Slot C (炎/エンベロープ): `0: 蜜蝋ろうそく束` (Pluck Decay `0.22s`), `1: 狐火ランタン` (Glide Decay `0.42s`), `2: パチパチ茨薪` (Punch Accent)
- **👻 幽霊（Theremin Choir Pad / Gain `0.15`）**:
  - Slot A (帽子/声質): `0: 縞々ナイトキャップ` (Theremin Choir 微デチューン`sine`), `1: 絵本の紙王冠` (Reed Organ `triangle`+`sawtooth`, LPF `1200Hz`), `2: 古レースのベール` (Glass Pad 倍音コーラス)
  - Slot B (顔/ボイシング): `0: ぽかん丸口` (Clockwork Polka ロング和音), `1: にっこり糸目` (Ghostly Shuffle 裏拍和音), `2: おろおろ涙目` (Cabaret Tango タンゴ和音)
  - Slot C (持ち物/LFO): `0: 小さな真鍮角燈` (Tremolo 4.5Hz), `1: 鎖の懐中時計` (Pitch Vibrato 6.0Hz ±15c), `2: 羽根ペンと楽譜` (Octave Shimmer)

## 3. 共通和声マップ（32ステップ: Cm -> Ab -> Fm -> G7, BPM 112）
- 全コードの `chord` は要素数4に統一し、骸骨の肋骨4段（`M0..M3`）とG7のセブンス音（`F4 = 349.23Hz`）に対応する。
- 大釜ベースの `root / fifth / octave` はノートPCのスピーカーでも明確に聴こえる `C2(65.41Hz)〜Ab3(207.65Hz)` 帯域に配置する。

```javascript
const CHORD_MAP = [
  // 0: Cm (Steps 0..7)  - Bass: C2, G2, C3 / Chord: C4, Eb4, G4, C5
  { name: 'Cm', root: 65.41,  fifth: 98.00,  octave: 130.81, chord: [261.63, 311.13, 392.00, 523.25], scale: [261.63, 293.66, 311.13, 392.00, 523.25] },
  // 1: Ab (Steps 8..15) - Bass: Ab2, Eb3, Ab3 / Chord: Ab3, C4, Eb4, Ab4
  { name: 'Ab', root: 103.83, fifth: 155.56, octave: 207.65, chord: [207.65, 261.63, 311.13, 415.30], scale: [207.65, 261.63, 311.13, 392.00, 415.30] },
  // 2: Fm (Steps 16..23) - Bass: F2, C3, F3 / Chord: F3, Ab3, C4, F4
  { name: 'Fm', root: 87.31,  fifth: 130.81, octave: 174.61, chord: [174.61, 207.65, 261.63, 349.23], scale: [174.61, 207.65, 261.63, 311.13, 349.23] },
  // 3: G7 (Steps 24..31) - Bass: G2, D3, G3 / Chord: G3, B3(導音), D4, F4(7th)
  { name: 'G7', root: 98.00,  fifth: 146.83, octave: 196.00, chord: [196.00, 246.94, 293.66, 349.23], scale: [196.00, 246.94, 293.66, 349.23, 493.88] }
];
```

## 4. リズムパターン配列と全トラック統一スウィング
1. **全トラック統一スウィング判定（フラム防止）**:
   - 主役（🎃かぼちゃ `tracks[0]`）またはドラム（💀骸骨 `tracks[1]`）の `slots[1] === 1 (Ghostly Shuffle)` が選択されている時、`isEnsembleSwing = true` とし、**全4トラック共通で**奇数ステップ（`step % 2 === 1`）に `swingOffset = stepDur * 0.32` を適用する。
   - `const scheduledTime = baseStepTime + (isEnsembleSwing && (step % 2 === 1) ? stepDur * 0.32 : 0);`
   - 音源予約と `visualQueue.push({ trackId, time: scheduledTime, ... })` の両方に必ずこの `scheduledTime` を渡す。
2. **8ステップ基本配列（×4コードで32ステップ展開）**:
```javascript
const PATTERNS = {
  pumpkin: [
    [0, -1, 2, -1, 3, -1, 2, -1], // 0: Clockwork Polka
    [0,  2, -1, 3, 4,  3, -1, 2], // 1: Ghostly Shuffle
    [2, -1, -1, 3, -1, -1, 4, -1] // 2: Cabaret Tango (3+3+2)
  ],
  skeleton: [
    ['K', -1,  'S', -1,  'K', -1,  'S', 'M3'], // 0: Clockwork Polka
    ['K', 'M0','S', 'M1','K', 'M2','S', 'M3'], // 1: Ghostly Shuffle
    ['K', -1,  'M1','K', -1,  'M2','S', 'M3']  // 2: Cabaret Tango (3+3+2)
  ],
  cauldron: [
    ['R', -1, -1, -1, 'F', -1, -1, -1], // 0: Clockwork Polka
    ['R', -1, 'F', 'O', 'R', -1, 'F', 'R'], // 1: Ghostly Shuffle
    ['R', -1, -1, 'F', -1, -1, 'O', -1]  // 2: Cabaret Tango (3+3+2)
  ],
  ghost: [
    ['C', -1, -1, -1, -1, -1, -1, -1],       // 0: Clockwork Polka
    [-1, 'A0', -1, 'A1', -1, 'A2', -1, 'A3'], // 1: Ghostly Shuffle
    ['C', -1, -1, 'C', -1, -1, 'A3', -1]     // 2: Cabaret Tango (3+3+2)
  ]
};
```

## 5. 音声出力時刻同期・停止処理・シームレスWAV出力
- **時刻取得**: `const now = (audioCtx.getOutputTimestamp?.().contextTime) || audioCtx.currentTime;`
- **減衰計算**: `visualQueue` から `event.time <= now` を消費して `track.lastNoteTime = event.time` を更新し、`energy = Math.exp(-(now - track.lastNoteTime) / 0.18)` でモーションを駆動。
- **停止＆カーテンコール**: `Stop` 時はタイマー破棄＋`activeNodes` 全停止＆切断＋`visualQueue` クリアを即座に行い、`stageState = 'curtain_call'`（1.8秒間のお辞儀＋💀頭蓋骨落下＆拾い上げアニメ）を経て幕を閉じる。
- **シームレスWAV**: マスターバスに `StereoDelay (time: (60/bpm)*0.75, fb: 0.22, wet: 0.18)` と `DynamicsCompressor` を配置。`OfflineAudioContext` で **64ステップ（2ループ）** をレンダリングし、残響が乗った **後半32ステップ分（`loopSamples` 〜 `loopSamples * 2`）** を切り出して44バイトRIFF WAVヘッダを付与する。
