<template>
  <div class="card player">
    <h2>Player</h2>

    <div
      class="drop-zone"
      @dragover.prevent
      @dragenter.prevent
      @drop.prevent="onDrop"
      @click="triggerFile"
    >
      <audio ref="audioEl" controls crossorigin="anonymous"></audio>
      <div class="drop-hint">Drop audio files here or click to open file dialog</div>
    </div>

    <input ref="fileInput" type="file" accept="audio/*" @change="onFile" style="display:none" />

    <div class="controls">
      <label>
        Sample:
        <select v-model="sample" @change="loadSample">
          <option value="">— choose —</option>
          <option value="https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/voice-change-o-matic/audio/harry_potter.mp3">Harry Potter demo</option>
        </select>
      </label>

      <label>
        Preamp (dB)
        <input type="range" min="-12" max="12" step="0.5" v-model.number="preamp" @input="onPreamp" />
        <span>{{ preamp }} dB</span>
      </label>

      <label>
        Stereo Pan
        <input type="range" min="-1" max="1" step="0.01" v-model.number="pan" @input="onPan" />
        <span>{{ pan }}</span>
      </label>

      <div class="knob-row">
        <Knob v-model="reverbMix" :min="0" :max="1" :step="0.01" :size="64" label="Reverb" @update:modelValue="onReverb" />
        <div class="knob-label">{{ (reverbMix * 100).toFixed(0) }}% wet</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import AudioEngine from '../audio/AudioEngine.ts'
import Knob from './Knob.vue'

export default defineComponent({
  name: 'Player',
  components: { Knob },
  emits: ['engine-ready'],
  setup(_, { emit }) {
    const audioEl = ref<HTMLAudioElement | null>(null)
    const fileInput = ref<HTMLInputElement | null>(null)
    const preamp = ref<number>(0)
    const pan = ref<number>(0)
    const reverbMix = ref<number>(0.3)
    const sample = ref<string>('')

    onMounted(() => {
      // init engine on first user play gesture
      if (!audioEl.value) return
      audioEl.value.addEventListener('play', async () => {
        await AudioEngine.resume()
        AudioEngine.connectToElement(audioEl.value!)
        AudioEngine.setReverbMix(reverbMix.value)
        emit('engine-ready', AudioEngine)
      }, { once: true })
    })

    function triggerFile() {
      fileInput.value?.click()
    }

    function onFile(e: Event) {
      const input = e.target as HTMLInputElement
      const file = input.files && input.files[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      if (audioEl.value) {
        audioEl.value.src = url
        audioEl.value.play().catch(()=>{})
      }
    }

    function onDrop(e: DragEvent) {
      if (!e.dataTransfer) return
      const file = e.dataTransfer.files[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      if (audioEl.value) {
        audioEl.value.src = url
        audioEl.value.play().catch(()=>{})
      }
    }

    function loadSample() {
      if (!sample.value || !audioEl.value) return
      audioEl.value.src = sample.value
      audioEl.value.play().catch(()=>{})
    }

    function onPreamp() {
      AudioEngine.setPreampGain(preamp.value)
    }

    function onPan() {
      AudioEngine.setPanner(pan.value)
    }

    function onReverb(val?: number) {
      // the knob emits update:modelValue which sets reverbMix via v-model; val may be undefined
      AudioEngine.setReverbMix(reverbMix.value)
    }

    return { audioEl, fileInput, preamp, pan, reverbMix, sample, triggerFile, onFile, onDrop, loadSample, onPreamp, onPan, onReverb }
  }
})
</script>

<style scoped>
.player { padding: 12px }
.drop-zone {
  position: relative;
  border: 1px dashed #2b3942;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.03));
}
.drop-hint { font-size:12px; color:#9aa3b2; margin-top:6px }
.controls { display:flex; flex-direction:column; gap:10px; margin-top:8px; }
label { display:flex; gap:8px; align-items:center;}
.knob-row { display:flex; align-items:center; gap:8px; }
.knob-label { color:#9aa3b2; font-size:12px }
</style>