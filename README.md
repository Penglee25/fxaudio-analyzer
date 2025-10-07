# Fx Audio Analyzer

Fx Audio Analyzer (fx-audio-analyzer) — a Vue 3 + TypeScript prototype for an FxSound-like web audio tool: 10-band EQ, preamp, stereo panner, wet/dry reverb (rotary knob), analyzer visualizer, preset manager (import/export) and drag-and-drop audio loading.

<!-- Small inline SVG demo image (renders in Github & most markdown viewers) -->
<p align="center">
  <!-- waveform-like SVG as a lightweight "cover" -->
  <svg width="640" height="160" viewBox="0 0 640 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fx Audio Analyzer">
    <rect width="100%" height="100%" fill="#071017"/>
    <g transform="translate(0,80)" stroke="#34d399" stroke-width="2" fill="none">
      <path d="M0,0 L20,-30 L40,10 L60,-10 L80,40 L100,-20 L120,25 L140,-25 L160,10 L180,-5 L200,20 L220,-40 L240,0 L260,15 L280,-15 L300,5 L320,-20 L340,30 L360,-10 L380,5 L400,-30 L420,20 L440,-5 L460,35 L480,-20 L500,10 L520,-5 L540,25 L560,-15 L580,10 L600,-30 L620,5 L640,0" />
    </g>
    <text x="18" y="26" fill="#e6eef6" font-family="Inter, Arial" font-size="18">Fx Audio Analyzer</text>
  </svg>
</p>

## Table of contents
- [Features](#features)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Preset import/export](#preset-importexport)
- [Adding custom impulse responses (IR)](#adding-custom-impulse-responses-ir)
- [Project structure](#project-structure)
- [Images / Documentation assets](#images--documentation-assets)
- [Contributing](#contributing)
- [License](#license)

## Features
- 10-band equalizer (peaking filters)
- Preamp (gain) and stereo panner
- Wet/Dry reverb implemented with ConvolverNode and wet/dry gain nodes
- Rotary SVG knob for reverb mix control
- Analyzer visualization (frequency bars)
- Drag-and-drop and file dialog audio loading
- Preset manager with save, import and export (JSON)
- Installer-like small UI to surface PWA beforeinstallprompt

## Quick start

Prerequisites:
- Node.js (recommended >= 18)
- npm

Install and run (from project root):
```bash
npm install
npm start        # or: npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

Notes:
- Modern browsers require a user gesture to start/resume the Web Audio API. Press play on the audio element to initialize the audio engine after loading a file.
- The project entry is `src/main.ts` and the app lives in `src/App.vue`.

## Usage

1. Load an audio file:
   - Drag-and-drop an audio file onto the player area, or click the player area to open the file dialog.
   - You can also choose the built-in sample from the dropdown.

2. Start playback:
   - Press play to initialize the AudioContext (user gesture required on many browsers). Once initialized the audio graph is connected and effects are active.

3. Adjust effects:
   - Use the 10 vertical sliders to sculpt frequency bands.
   - Use the Preamp slider to boost/attenuate overall volume (dB).
   - Use Stereo Pan to shift audio left/right.
   - Use the Reverb rotary knob to mix between dry and wet signals (0% = dry, 100% = fully wet).

4. Presets:
   - Click a preset to apply it.
   - Save the current settings as a custom preset.
   - Export all presets to a JSON file.
   - Import a JSON file of presets (validated/merged).

## Preset import/export

- Export creates a file named `fxsound-presets.json` containing an array of presets. Each preset object has the shape:
```json
{
  "name": "Preset name",
  "preamp": 1.5,
  "panner": 0,
  "reverbMix": 0.3,
  "eq": [0, 0, -1, 2, 4, 3, 1, 0, 0, 0]
}
```

- To import presets, choose a JSON file exported from this app (an array of objects as above). Imported presets will be merged into local presets and persisted to `localStorage`.

## Adding custom impulse responses (IR)
To use a custom IR for the ConvolverNode:
1. Add the `.wav` (or audio file) IR file into `public/assets/ir/` (create directory).
2. Add a UI control to upload/select an IR file (the current prototype can be extended to call AudioEngine._loadImpulseFromUrl or similar).
3. Use `AudioContext.decodeAudioData()` to create a buffer and set `convolver.buffer = decodedBuffer`.

## Project structure
```
src/
  main.ts
  App.vue
  styles.css
  audio/
    AudioEngine.ts       # audio graph & API
  components/
    Player.vue
    Equalizer.vue
    Visualizer.vue
    Knob.vue
    PresetManager.vue
    Installer.vue
public/
  assets/
    cover.png            # recommended place for README / landing images
    diagram.png
package.json
vite.config.ts
tsconfig.json
README.md
```

## Development notes & tips
- Type checking:
  ```bash
  npm run typecheck
  ```
- The engine is exposed as a singleton `src/audio/AudioEngine.ts`. Components import the singleton or the class type for prop typing:
  ```ts
  import AudioEngine, { AudioEngine as AudioEngineClass } from './audio/AudioEngine'
  ```
- Keep `createMediaElementSource` calls to one per HTMLAudioElement. If you need multiple sources, create separate elements or use AudioBufferSourceNodes.

## Contributing
Contributions welcome. Suggested workflow:
1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit changes and open a PR
4. Run `npm run typecheck` and `npm run dev` locally before opening a PR

Add an issue for large changes so we can discuss design and audio graph changes (for example: multi-band compression, HRTF spatializer, or custom IR browsing).
