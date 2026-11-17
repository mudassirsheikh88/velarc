/* VELARC — vector artwork for the scroll scenes (all original drawings).
   Side-view parts use a local origin at the rear wheel contact point: x grows forward (right), y grows down, ground is y=0. */
(() => {
  const defs = `
  <defs>
    <linearGradient id="vg-cab" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3e45"/><stop offset=".45" stop-color="#1c1f24"/><stop offset="1" stop-color="#0c0d10"/>
    </linearGradient>
    <linearGradient id="vg-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7f8ea6"/><stop offset=".45" stop-color="#26303f"/><stop offset="1" stop-color="#0d1118"/>
    </linearGradient>
    <linearGradient id="vg-box" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f1f2f4"/><stop offset=".6" stop-color="#d5d8dc"/><stop offset="1" stop-color="#b3b7bd"/>
    </linearGradient>
    <linearGradient id="vg-navy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d4579"/><stop offset="1" stop-color="#16264a"/></linearGradient>
    <linearGradient id="vg-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9673a"/><stop offset="1" stop-color="#a6431f"/></linearGradient>
    <linearGradient id="vg-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b5059"/><stop offset="1" stop-color="#23262b"/></linearGradient>
    <linearGradient id="vg-top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9ccd1"/><stop offset=".5" stop-color="#f4f5f7"/><stop offset="1" stop-color="#c9ccd1"/></linearGradient>
    <linearGradient id="vg-cabtop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0e11"/><stop offset=".5" stop-color="#2b2f36"/><stop offset="1" stop-color="#0d0e11"/></linearGradient>
    <pattern id="vg-hazard" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#ffb21a"/><rect width="5" height="10" fill="#141414"/></pattern>
    <filter id="vg-glow" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;

  const wheel = (cx, r, cls = 'spin') => `
    <g transform="translate(${cx} ${-r})">
      <g class="${cls}">
        <circle r="${r}" fill="#0f1012"/>
        <circle r="${r * .66}" fill="#1f2226"/>
        <circle r="${r * .5}" fill="#9aa0a8"/>
        <circle r="${r * .4}" fill="#c4c8ce"/>
        ${[0, 72, 144, 216, 288].map(a => `<circle r="${r * .07}" cx="${Math.cos(a * Math.PI / 180) * r * .26}" cy="${Math.sin(a * Math.PI / 180) * r * .26}" fill="#6b7179"/>`).join('')}
        <rect x="${-r * .06}" y="${-r * .5}" width="${r * .12}" height="${r * .14}" fill="#6b7179"/>
        <circle r="${r * .09}" fill="#2a2d32"/>
      </g>
    </g>`;

  /* Electric tractor, 300 long, faces right */
  const tractor = () => `
    <g class="tractor">
      <rect x="0" y="-74" width="300" height="14" rx="3" fill="#121316"/>
      <rect x="18" y="-86" width="84" height="12" rx="3" fill="#2b2f36"/>
      <path d="M112 -60 V-196 Q112 -228 144 -230 H262 Q294 -230 298 -198 L302 -74 Q302 -60 290 -60 Z" fill="url(#vg-cab)"/>
      <path d="M122 -230 Q128 -262 172 -264 H250 Q278 -264 286 -232 Z" fill="#1d2025"/>
      <path d="M268 -222 H294 L298 -150 H270 Z" fill="url(#vg-glass)"/>
      <path d="M200 -220 H258 V-160 H200 Z" fill="url(#vg-glass)" opacity=".9"/>
      <path d="M196 -226 V-66" stroke="#08090a" stroke-width="2"/>
      <rect x="244" y="-150" width="16" height="4" rx="2" fill="#4a505a"/>
      <rect x="298" y="-214" width="7" height="42" rx="2" fill="#1a1c20"/>
      <rect class="drl" x="282" y="-118" width="20" height="5" rx="2" fill="#ff7a1a" filter="url(#vg-glow)"/>
      <rect x="286" y="-96" width="16" height="4" rx="2" fill="#e9edf3" opacity=".8"/>
      <rect x="272" y="-74" width="34" height="16" rx="3" fill="#0a0b0d"/>
      <rect x="124" y="-110" width="128" height="40" rx="5" fill="#0f1114"/>
      <rect class="batt" x="130" y="-96" width="116" height="5" rx="2" fill="#3d6bff" filter="url(#vg-glow)"/>
      <path transform="translate(214 -146) scale(.9)" d="M0 0h8l7 12.5L22 0h8L18 21h-6z" fill="#e9edf3"/>
      <path d="M8 -38 Q74 -100 140 -38" fill="none" stroke="#0a0b0d" stroke-width="8"/>
      <path d="M222 -38 Q258 -96 300 -38" fill="none" stroke="#0a0b0d" stroke-width="8"/>
      ${wheel(42, 34)}${wheel(108, 34)}${wheel(262, 35)}
    </g>`;

  /* Skeletal container chassis, 640 long, deck top at y=-104 */
  const chassis = () => `
    <g class="chassis">
      <rect x="0" y="-104" width="640" height="16" fill="#1a1c20"/>
      <rect x="0" y="-104" width="640" height="3" fill="#3a3e45"/>
      <rect x="548" y="-112" width="92" height="12" fill="#1a1c20"/>
      <rect x="560" y="-90" width="70" height="14" fill="#1a1c20"/>
      <rect x="250" y="-70" width="290" height="6" fill="#2b2e33"/>
      <rect x="470" y="-88" width="8" height="58" fill="#2b2e33"/><rect x="462" y="-32" width="24" height="6" fill="#2b2e33"/>
      <rect x="16" y="-82" width="6" height="40" fill="#0f1012"/>
      <rect x="4" y="-92" width="14" height="6" fill="#d7262b"/>
      ${[16, 556].map(x => `<rect x="${x}" y="-110" width="12" height="8" fill="#ffb21a"/>`).join('')}
      <path d="M36 -40 Q140 -110 252 -40" fill="none" stroke="#111214" stroke-width="8"/>
      ${wheel(70, 32)}${wheel(142, 32)}${wheel(214, 32)}
    </g>`;

  /* 40ft container side view: width w (anim from end-view width to 600), height 150, origin bottom-left */
  const containerSide = () => `
    <g class="box-side">
      <rect class="bx-body" x="0" y="-150" width="600" height="150" fill="url(#vg-box)"/>
      <g class="bx-ribs" stroke="#c3c7cc" stroke-width="2"></g>
      <rect class="bx-toprail" x="0" y="-150" width="600" height="8" fill="#e7e9ec"/>
      <rect class="bx-botrail" x="0" y="-12" width="600" height="12" fill="#9da2a9"/>
      <rect class="bx-door" x="588" y="-150" width="12" height="150" fill="#b8bcc2"/>
      <g class="bx-corners" fill="#8c9198"></g>
      <text class="bx-code" x="16" y="-128" font-family="JetBrains Mono, monospace" font-size="11" fill="#5b6068">VLRU 280466 2 · 45G1</text>
      <path class="bx-mark" d="M0 0h8l7 12.5L22 0h8L18 21h-6z" fill="#5b6068" transform="translate(280 -92) scale(1.2)"/>
    </g>`;

  /* container end view, 150 wide x 150 tall, origin bottom-left */
  const containerEnd = (fill, cls = '') => `
    <g class="box-end ${cls}">
      <rect x="0" y="-150" width="150" height="150" fill="${fill}"/>
      <rect x="0" y="-150" width="150" height="8" fill="#000" opacity=".18"/>
      <rect x="0" y="-12" width="150" height="12" fill="#000" opacity=".25"/>
      <path d="M75 -142 V-12" stroke="#000" stroke-opacity=".35" stroke-width="2"/>
      <g stroke="#000" stroke-opacity=".3" stroke-width="3">
        <path d="M22 -138 V-16M52 -138 V-16M98 -138 V-16M128 -138 V-16"/>
      </g>
      <g fill="#000" opacity=".35"><rect x="17" y="-82" width="10" height="16"/><rect x="47" y="-82" width="10" height="16"/><rect x="93" y="-82" width="10" height="16"/><rect x="123" y="-82" width="10" height="16"/></g>
      <g fill="#000" opacity=".3"><rect x="0" y="-150" width="10" height="10"/><rect x="140" y="-150" width="10" height="10"/><rect x="0" y="-10" width="10" height="10"/><rect x="140" y="-10" width="10" height="10"/></g>
    </g>`;

  /* Reach stacker, 380 long, faces right. Boom group is positioned by script. */
  const stacker = () => `
    <g class="stacker">
      <g class="stk-boom">
        <path class="stk-cyl" d="" stroke="#8b9099" stroke-width="10" stroke-linecap="round"/>
        <g class="stk-arm">
          <rect class="stk-outer" x="-14" y="-17" width="320" height="34" rx="4" fill="#2f333a"/>
          <rect class="stk-inner" x="240" y="-12" width="260" height="24" rx="3" fill="#4a4f58"/>
          <rect x="0" y="-17" width="320" height="5" fill="#ff7a1a"/>
          <text x="40" y="5" font-family="Saira, sans-serif" font-weight="800" font-size="13" letter-spacing="3" fill="#dfe3e8" style="font-stretch:120%">VELARC YARD</text>
        </g>
      </g>
      <rect x="-12" y="-176" width="98" height="104" rx="6" fill="#16181c"/>
      <path d="M0 -70 V-130 Q0 -144 14 -144 H330 Q372 -144 380 -110 V-70 Z" fill="url(#vg-body)"/>
      <rect x="0" y="-104" width="380" height="6" fill="#ff7a1a"/>
      <g class="stk-cab">
        <path d="M168 -144 V-236 H246 L252 -144 Z" fill="#1c1f24"/>
        <path d="M176 -228 H240 L244 -152 H176 Z" fill="url(#vg-glass)"/>
        <rect x="164" y="-244" width="92" height="10" rx="3" fill="#2b2f36"/>
        <rect x="236" y="-252" width="10" height="8" fill="#ffb21a"/>
      </g>
      <rect x="36" y="-160" width="30" height="20" fill="#2f333a"/>
      <path d="M30 -46 Q84 -122 138 -46" fill="none" stroke="#0e0f11" stroke-width="10"/>
      <path d="M262 -50 Q318 -128 374 -50" fill="none" stroke="#0e0f11" stroke-width="10"/>
      ${wheel(84, 46, 'spin-stk')}${wheel(318, 48, 'spin-stk')}
    </g>`;

  /* telescopic spreader that hangs below the boom tip. width animates. */
  const spreader = () => `
    <g class="spreader">
      <rect x="-22" y="0" width="44" height="22" rx="3" fill="#202328"/>
      <rect class="spr-beam" x="-75" y="22" width="150" height="12" fill="#2b2f36"/>
      <rect class="spr-l" x="-75" y="20" width="16" height="16" fill="url(#vg-hazard)"/>
      <rect class="spr-r" x="59" y="20" width="16" height="16" fill="url(#vg-hazard)"/>
    </g>`;

  const sideScene = () => `
    ${defs}
    <rect class="ground" x="-6000" y="0" width="14000" height="9000" fill="#111214"/>
    <g class="stack">
      <g transform="translate(1080 0)">${containerEnd('url(#vg-navy)')}</g>
      <g transform="translate(1238 0)">${containerEnd('url(#vg-orange)')}</g>
    </g>
    <g class="truck">
      <g class="truck-inner">
        <g class="chassis-pos">${chassis()}</g>
        <g class="tractor-pos" transform="translate(520 0)">${tractor()}</g>
      </g>
    </g>
    <g class="stk-pos">${stacker()}</g>
    <g class="load">
      <g class="load-end">${containerEnd('url(#vg-box)', 'grey')}</g>
      <g class="load-side">${containerSide()}</g>
    </g>
    <g class="spr-pos">${spreader()}</g>
  `;

  /* Top-down truck, facing +x, centered on origin. Length 700, width 112. */
  const truckTop = () => `
    <g class="ttruck">
      <rect x="-352" y="-60" width="704" height="120" rx="10" fill="#000" opacity=".22" transform="translate(5 6)"/>
      <rect x="-350" y="-56" width="560" height="112" rx="4" fill="url(#vg-top)"/>
      <g stroke="#c2c6cc" stroke-width="3">${Array.from({ length: 26 }, (_, i) => `<path d="M${-338 + i * 21} -52 V52"/>`).join('')}</g>
      <rect x="-350" y="-56" width="560" height="8" fill="#e8eaed"/>
      <rect x="-350" y="48" width="560" height="8" fill="#b7bbc1"/>
      <g fill="#9ea3aa"><rect x="-350" y="-56" width="14" height="14"/><rect x="196" y="-56" width="14" height="14"/><rect x="-350" y="42" width="14" height="14"/><rect x="196" y="42" width="14" height="14"/></g>
      <rect x="210" y="-14" width="30" height="28" fill="#15171a"/>
      <rect x="236" y="-58" width="116" height="116" rx="16" fill="url(#vg-cabtop)"/>
      <rect x="250" y="-46" width="58" height="92" rx="8" fill="#0b0c0e"/>
      <rect x="318" y="-50" width="26" height="100" rx="8" fill="#3d4757"/>
      <rect x="346" y="-50" width="4" height="100" rx="2" fill="#ff7a1a" filter="url(#vg-glow)"/>
      <rect x="296" y="-66" width="14" height="8" rx="2" fill="#15171a"/><rect x="296" y="58" width="14" height="8" rx="2" fill="#15171a"/>
      <rect class="tt-tail" x="-354" y="-50" width="4" height="22" fill="#e0262c" filter="url(#vg-glow)"/>
      <rect class="tt-tail" x="-354" y="28" width="4" height="22" fill="#e0262c" filter="url(#vg-glow)"/>
    </g>`;

  /* Illustrated portraits for the operator quotes (original, fictional people). viewBox 0 0 200 200 */
  const portrait = o => {
    const id = o.id;
    const face = `
      <path d="M${100 - o.fw} 96 C ${100 - o.fw} 52 ${100 + o.fw} 52 ${100 + o.fw} 96 C ${100 + o.fw} 128 ${100 + o.fw * .55} 146 100 146 C ${100 - o.fw * .55} 146 ${100 - o.fw} 128 ${100 - o.fw} 96 Z" fill="url(#${id}-skin)"/>
      <path d="M${100 - o.fw + 4} 104 C ${100 - o.fw + 8} 132 ${86} 144 100 145 C ${88} 140 ${100 - o.fw + 14} 128 ${100 - o.fw + 4} 104Z" fill="#000" opacity=".08"/>
      <path d="M${100 - o.fw * .6} 94 q 7 -5 15 -2" stroke="${o.brow}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M${100 + o.fw * .6} 94 q -7 -5 -15 -2" stroke="${o.brow}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="${100 - o.fw * .38}" cy="103" rx="4.6" ry="3.4" fill="#fff"/><ellipse cx="${100 + o.fw * .38}" cy="103" rx="4.6" ry="3.4" fill="#fff"/>
      <circle cx="${100 - o.fw * .38}" cy="103.3" r="2.9" fill="#2a1d16"/><circle cx="${100 + o.fw * .38}" cy="103.3" r="2.9" fill="#2a1d16"/>
      <circle cx="${100 - o.fw * .38 + 1}" cy="102.3" r=".9" fill="#fff"/><circle cx="${100 + o.fw * .38 + 1}" cy="102.3" r=".9" fill="#fff"/>
      <path d="M98 106 q -4 12 -1 16 q 4 2 7 0" stroke="#000" stroke-opacity=".22" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M88 129 q 12 9 24 0" stroke="${o.lip}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <ellipse cx="${100 - o.fw * .62}" cy="120" rx="7" ry="4" fill="#e0614a" opacity=".12"/><ellipse cx="${100 + o.fw * .62}" cy="120" rx="7" ry="4" fill="#e0614a" opacity=".12"/>`;
    return `<svg viewBox="0 0 200 200" role="img" aria-label="Illustrated portrait of ${o.name}">
      <defs>
        <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.bg[0]}"/><stop offset="1" stop-color="${o.bg[1]}"/></linearGradient>
        <radialGradient id="${id}-skin" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="${o.skin[0]}"/><stop offset="1" stop-color="${o.skin[1]}"/></radialGradient>
        <linearGradient id="${id}-cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.cloth[0]}"/><stop offset="1" stop-color="${o.cloth[1]}"/></linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#${id}-bg)"/>
      <g opacity=".5">${o.backdrop}</g>
      ${o.back || ''}
      <path d="M86 132 h28 v26 q -14 10 -28 0z" fill="${o.skin[1]}"/>
      <path d="M8 200 C 14 168 44 152 78 150 Q 100 166 122 150 C 156 152 186 168 192 200 Z" fill="url(#${id}-cloth)"/>
      ${o.torso || ''}
      ${o.ears ? `<ellipse cx="${100 - o.fw - 1}" cy="106" rx="6" ry="10" fill="${o.skin[1]}"/><ellipse cx="${100 + o.fw + 1}" cy="106" rx="6" ry="10" fill="${o.skin[1]}"/>` : ''}
      ${face}
      ${o.front || ''}
    </svg>`;
  };
  const PORTRAITS = {
    layla: portrait({
      id: 'pl', name: 'Layla Al-Amin', fw: 32, brow: '#2b1a12', lip: '#a4524a',
      bg: ['#d9e1ea', '#9fb0c4'], skin: ['#d9a07a', '#b57a55'], cloth: ['#2a3442', '#151b24'],
      backdrop: '<rect x="128" y="20" width="60" height="120" rx="4" fill="#fff"/><rect x="18" y="40" width="40" height="70" rx="4" fill="#fff"/>',
      back: '<path d="M56 100 C 50 46 150 46 144 100 L 150 178 Q 100 196 50 178 Z" fill="#1f5c63"/>',
      torso: '<path d="M60 160 Q 100 182 140 160 L 150 200 H 50 Z" fill="#1f5c63"/><path d="M60 160 Q 100 182 140 160" stroke="#174a50" stroke-width="3" fill="none"/>',
      front: '<path d="M68 96 C 66 60 134 60 132 96 C 132 76 118 64 100 64 C 82 64 68 76 68 96 Z" fill="#1f5c63"/><path d="M70 96 C 70 128 82 150 100 154 C 118 150 130 128 130 96 C 134 132 120 162 100 164 C 80 162 66 132 70 96Z" fill="#1f5c63"/><path d="M76 74 Q 100 58 124 74" stroke="#2d7880" stroke-width="3" fill="none"/>'
    }),
    marten: portrait({
      id: 'pm', name: 'Marten Kroll', fw: 31, brow: '#7a5a3a', lip: '#b56a5c', ears: true,
      bg: ['#e7e2da', '#b9b0a3'], skin: ['#f3cfb3', '#d9a888'], cloth: ['#24324f', '#121a2b'],
      backdrop: '<rect x="20" y="24" width="160" height="6" fill="#fff"/><rect x="140" y="40" width="40" height="90" fill="#fff"/>',
      torso: '<path d="M80 152 L100 196 L120 152 Q 110 160 100 160 Q 90 160 80 152Z" fill="#f4f5f7"/><path d="M100 168 l-6 32 h12z" fill="#7a1f2b"/><path d="M78 150 L96 200 H70 L58 158Z M122 150 L104 200 H130 L142 158Z" fill="#1b2640"/>',
      front: '<path d="M68 92 C 64 54 92 46 104 48 C 126 50 138 66 132 92 C 128 78 120 72 112 70 C 98 76 82 74 74 70 C 70 76 68 84 68 92Z" fill="#a8835a"/><path d="M74 116 C 76 138 90 146 100 146 C 110 146 124 138 126 116 C 120 132 112 138 100 138 C 88 138 80 132 74 116Z" fill="#a8835a" opacity=".55"/><g fill="none" stroke="#2a2e35" stroke-width="2.6"><rect x="72" y="95" width="22" height="16" rx="5"/><rect x="106" y="95" width="22" height="16" rx="5"/><path d="M94 101 h12M72 100 l-6 -2M128 100 l6 -2"/></g>'
    }),
    priya: portrait({
      id: 'pp', name: 'Priya Raman', fw: 31, brow: '#1c120d', lip: '#9c3f45',
      bg: ['#efe3dd', '#c9a99c'], skin: ['#b98260', '#8f5c3e'], cloth: ['#7b2236', '#4d1220'],
      backdrop: '<circle cx="160" cy="44" r="26" fill="#fff"/><rect x="14" y="70" width="34" height="90" rx="4" fill="#fff"/>',
      back: '<path d="M62 96 C 56 44 144 44 138 96 C 146 130 150 170 156 196 L 44 196 C 50 170 54 130 62 96Z" fill="#17100c"/>',
      torso: '<path d="M80 150 Q 100 176 120 150 Q 108 168 100 168 Q 92 168 80 150Z" fill="#5e1828"/><circle cx="100" cy="166" r="3" fill="#e9c46a"/>',
      front: '<path d="M70 98 C 66 58 96 50 100 52 C 104 50 134 58 130 98 C 126 80 112 66 100 62 C 88 66 74 80 70 98Z" fill="#17100c"/><path d="M100 54 v12" stroke="#2c201a" stroke-width="1.5"/><circle cx="70" cy="122" r="3" fill="#e9c46a"/><circle cx="130" cy="122" r="3" fill="#e9c46a"/>'
    })
  };

  window.VScene = { defs, sideScene, truckTop, PORTRAITS };
})();
