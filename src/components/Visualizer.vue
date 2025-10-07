<template>
  <div class="card visualizer">
    <h2>Analyzer</h2>
    <canvas ref="c" width="800" height="160"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, onBeforeUnmount, PropType } from 'vue'
import type { AudioEngine as AudioEngineClass } from '../audio/AudioEngine.ts'
import AudioEngine from '../audio/AudioEngine.ts'

export default defineComponent({
  name: 'Visualizer',
  props: {
    engine: {
      type: Object as PropType<AudioEngineClass>,
      required: false
    }
  },
  setup(props) {
    const canvas = ref<HTMLCanvasElement | null>(null)
    let raf = 0

    function drawLoop() {
      const engine = props.engine || AudioEngine
      if (!canvas.value) {
        raf = requestAnimationFrame(drawLoop)
        return
      }
      const ctx2d = canvas.value.getContext('2d')!
      const w = canvas.value.width
      const h = canvas.value.height
      const data = engine.getAnalyserData()
      if (data) {
        ctx2d.fillStyle = '#0b0b0b'
        ctx2d.fillRect(0, 0, w, h)
        const barWidth = Math.max(1, Math.floor(w / data.length))
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 255
          const y = v * h
          ctx2d.fillStyle = `hsl(${(i / data.length) * 360}, 80%, ${20 + v * 50}%)`
          ctx2d.fillRect(i * barWidth, h - y, barWidth - 1, y)
        }
      }
      raf = requestAnimationFrame(drawLoop)
    }

    onMounted(() => {
      raf = requestAnimationFrame(drawLoop)
    })
    onBeforeUnmount(() => cancelAnimationFrame(raf))

    return { canvas }
  }
})
</script>

<style scoped>
.visualizer canvas { width: 100%; height: 160px; background: #111; display:block; }
</style>