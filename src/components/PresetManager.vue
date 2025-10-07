<template>
  <div class="card presets">
    <h2>Presets</h2>
    <div class="preset-list">
      <button v-for="p in presets" :key="p.name" @click="apply(p)">{{ p.name }}</button>
    </div>

    <div class="custom">
      <input v-model="name" placeholder="Preset name" />
      <button @click="save">Save Current</button>
      <button @click="exportAll">Export All</button>
      <button @click="triggerImport">Import</button>
      <input ref="importInput" type="file" accept="application/json" @change="onImportFile" style="display:none" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, PropType } from 'vue'
import defaultPresets from '../presets.json'
import AudioEngine, { Preset, AudioEngine as AudioEngineClass } from '../audio/AudioEngine.ts'

export default defineComponent({
  name: 'PresetManager',
  props: {
    engine: {
      type: Object as PropType<AudioEngineClass>,
      required: false
    }
  },
  setup(props) {
    const presets = ref<Preset[]>(defaultPresets as Preset[])
    const name = ref('')
    const importInput = ref<HTMLInputElement | null>(null)

    function apply(p: Preset) {
      const eng = props.engine || AudioEngine
      if (!eng) {
        alert('Load audio first (a user gesture is needed to initialize audio).')
        return
      }
      eng.applyPreset(p)
    }

    function save() {
      const eng = props.engine || AudioEngine
      if (!eng || !eng.eqNodes) return
      const eq = eng.eqNodes.map((n) => Number(n.gain.value.toFixed(2)))
      const preset: Preset = {
        name: name.value || 'User preset',
        preamp: Number((Math.log10(eng.gainNode!.gain.value) * 20).toFixed(2)) || 0,
        panner: Number(eng.panner!.pan.value.toFixed(2)) || 0,
        reverbMix: Number((eng.reverbMix || 0).toFixed(2)),
        eq
      }
      presets.value.push(preset)
      name.value = ''
      try { localStorage.setItem('fxsound_presets', JSON.stringify(presets.value)) } catch (e) {}
      alert('Saved preset locally (not synced).')
    }

    function exportAll() {
      try {
        const json = JSON.stringify(presets.value, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'fxsound-presets.json'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch (e) {
        alert('Failed to export presets.')
        console.error(e)
      }
    }

    function triggerImport() {
      importInput.value?.click()
    }

    async function onImportFile(e: Event) {
      const input = e.target as HTMLInputElement
      const file = input.files && input.files[0]
      if (!file) return
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        if (!Array.isArray(parsed)) {
          alert('Invalid preset file: expected an array of presets.')
          return
        }
        // basic validation and normalization
        const imported: Preset[] = parsed.map((p: any) => {
          return {
            name: String(p.name || 'Imported preset'),
            preamp: typeof p.preamp === 'number' ? p.preamp : 0,
            panner: typeof p.panner === 'number' ? p.panner : 0,
            reverbMix: typeof p.reverbMix === 'number' ? Math.max(0, Math.min(1, p.reverbMix)) : 0,
            eq: Array.isArray(p.eq) ? p.eq.map((v: any) => Number(v) || 0) : Array(10).fill(0)
          }
        })
        presets.value = presets.value.concat(imported)
        try { localStorage.setItem('fxsound_presets', JSON.stringify(presets.value)) } catch {}
        alert(`Imported ${imported.length} presets.`)
      } catch (err) {
        alert('Failed to import presets: invalid JSON.')
        console.error(err)
      } finally {
        // clear input
        input.value = ''
      }
    }

    onMounted(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('fxsound_presets') || '[]')
        if (Array.isArray(stored)) presets.value = stored.concat(presets.value)
      } catch (e) {}
    })

    return { presets, name, apply, save, exportAll, triggerImport, onImportFile, importInput }
  }
})
</script>

<style scoped>
.presets { padding: 12px }
.preset-list { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px }
.preset-list button { padding:6px 8px }
.custom { display:flex; gap:8px; align-items:center }
.custom input { flex:1; padding:6px }
</style>