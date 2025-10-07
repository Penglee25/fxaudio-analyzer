<template>
  <div class="card eq">
    <h2>10-band Equalizer</h2>
    <div class="bands">
      <div class="band" v-for="(f, i) in freqs" :key="f">
        <input type="range" orient="vertical" min="-12" max="12" step="0.5" v-model.number="gains[i]" @input="onGainChange(i)" />
        <div class="label">{{ f }} Hz</div>
        <div class="gain">{{ gains[i] }} dB</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, PropType } from 'vue'
import type { AudioEngine as AudioEngineClass } from '../audio/AudioEngine.ts'
import AudioEngine from '../audio/AudioEngine.ts'

export default defineComponent({
  name: 'Equalizer',
  props: {
    engine: {
      type: Object as PropType<AudioEngineClass>,
      required: false
    }
  },
  setup(props) {
    const freqs = props.engine ? props.engine.getFrequencies() : AudioEngine.getFrequencies()
    const gains = ref<number[]>(Array(10).fill(0))

    onMounted(() => {
      const engine = props.engine || AudioEngine
      if (engine && (engine as any).eqNodes) {
        (engine as any).eqNodes.forEach((node: any, idx: number) => {
          gains.value[idx] = node.gain.value
        })
      }
    })

    function onGainChange(idx: number) {
      const engine = props.engine || AudioEngine
      if (!engine) return
      engine.setBandGain(idx, gains.value[idx])
    }

    return { freqs, gains, onGainChange }
  }
})
</script>

<style scoped>
.eq { padding: 12px }
.bands { display:flex; gap:8px; align-items:flex-end; padding:10px; overflow:auto }
.band { display:flex; flex-direction:column; align-items:center; width:56px }
input[type="range"] { writing-mode: bt-lr; -webkit-appearance: slider-vertical; height:160px; }
.label { font-size:12px; margin-top:6px }
.gain { font-size:12px; color:#666 }
</style>