// 4体のパペットと全36パーツの定義（design.md §1, §2 準拠）。
// 音色パラメータは Task 2 以降で参照する。ここでは UI 表示用の名前と説明のみ保持する。

export const PUPPETS = [
  {
    id: 'pumpkin', icon: '🎃', name: 'かぼちゃ', role: 'Lead Synth',
    color: '#D97236', accent: '#F7C873',
    slots: [
      { label: '目', hint: '音色', options: [
        { name: '三日月目', note: 'triangle + Sub' },
        { name: '木製ボタン目', note: 'square' },
        { name: '星くり抜き目', note: 'detuned saw' },
      ]},
      { label: '鼻', hint: 'フレーズ', options: [
        { name: '三角彫り鼻', note: 'Clockwork Polka' },
        { name: 'くるりん蔓鼻', note: 'Ghostly Shuffle' },
        { name: '逆さハート鼻', note: 'Cabaret Tango' },
      ]},
      { label: '口', hint: '奏法', options: [
        { name: 'ギザギザ笑顔', note: 'Staccato' },
        { name: 'おちょぼ丸口', note: 'Vibrato' },
        { name: 'ニヤリ八重歯', note: 'Portamento' },
      ]},
    ],
  },
  {
    id: 'skeleton', icon: '💀', name: '骸骨', role: 'Drums & Bone Marimba',
    color: '#E8DCC4', accent: '#B5A48B',
    slots: [
      { label: '頭', hint: 'ドラム音質', options: [
        { name: '折れシルクハット', note: 'Wood Kick + Brush' },
        { name: 'ぜんまいネジ頭', note: 'Toy Kick + Snappy' },
        { name: 'ブリキ王冠', note: 'Deep Kick + Rim' },
      ]},
      { label: '肋骨', hint: 'ビート', options: [
        { name: '4つ箱あばら', note: 'Clockwork Polka' },
        { name: '真鍮継ぎあばら', note: 'Ghostly Shuffle' },
        { name: '蜘蛛の巣あばら', note: 'Cabaret Tango' },
      ]},
      { label: 'バチ', hint: '木琴音色', options: [
        { name: '大腿骨マレット', note: 'Warm Marimba' },
        { name: '銀のスプーン', note: 'Glassy Xylophone' },
        { name: '枯れ枝タクト', note: 'Wood Clack' },
      ]},
    ],
  },
  {
    id: 'cauldron', icon: '🧪', name: '魔女の大釜', role: 'Acid Bubble Bass',
    color: '#2B303A', accent: '#76A884',
    slots: [
      { label: '釜', hint: '波形', options: [
        { name: '猫足の黒鉄釜', note: 'sawtooth' },
        { name: '真鍮ツギハギ釜', note: 'square + EnvLPF' },
        { name: 'ひび割れ陶器釜', note: 'triangle + Sub' },
      ]},
      { label: '具材', hint: 'パターン', options: [
        { name: '光る毒キノコ', note: 'Clockwork Polka' },
        { name: 'ぜんまいカエル', note: 'Ghostly Shuffle' },
        { name: '星空の目玉', note: 'Cabaret Tango' },
      ]},
      { label: '炎', hint: 'エンベロープ', options: [
        { name: '蜜蝋ろうそく束', note: 'Pluck' },
        { name: '狐火ランタン', note: 'Glide' },
        { name: 'パチパチ茨薪', note: 'Punch' },
      ]},
    ],
  },
  {
    id: 'ghost', icon: '👻', name: '幽霊', role: 'Theremin Choir Pad',
    color: '#EAE6DF', accent: '#D98A82',
    slots: [
      { label: '帽子', hint: '声質', options: [
        { name: '縞々ナイトキャップ', note: 'Theremin Choir' },
        { name: '絵本の紙王冠', note: 'Reed Organ' },
        { name: '古レースのベール', note: 'Glass Pad' },
      ]},
      { label: '顔', hint: 'ボイシング', options: [
        { name: 'ぽかん丸口', note: 'Clockwork Polka' },
        { name: 'にっこり糸目', note: 'Ghostly Shuffle' },
        { name: 'おろおろ涙目', note: 'Cabaret Tango' },
      ]},
      { label: '持ち物', hint: 'LFO', options: [
        { name: '小さな真鍮角燈', note: 'Tremolo' },
        { name: '鎖の懐中時計', note: 'Pitch Vibrato' },
        { name: '羽根ペンと楽譜', note: 'Octave Shimmer' },
      ]},
    ],
  },
];
