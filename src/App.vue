<template>
  <div id="app">
    <header>
      <h1>FxSound Web — Vue 3 + TypeScript</h1>
      <Installer @engine-ready="onEngineReady" />
    </header>

    <main>
      <section class="left">
        <Player @engine-ready="onEngineReady" />
        <PresetManager :engine="engine" />
      </section>

      <section class="right">
        <Equalizer :engine="engine" v-if="engine" />
        <Visualizer :engine="engine" v-if="engine" />
      </section>
    </main>

    <footer>
      <small>Prototype audio effects using the Web Audio API — extend as needed.</small>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Player from './components/Player.vue'
import Equalizer from './components/Equalizer.vue'
import Visualizer from './components/Visualizer.vue'
import PresetManager from './components/PresetManager.vue'
import Installer from './components/Installer.vue'
import AudioEngine, { AudioEngine as AudioEngineClass } from './audio/AudioEngine.ts'

export default defineComponent({
  name: 'App',
  components: { Player, Equalizer, Visualizer, PresetManager, Installer },
  setup() {
    // Initialize with undefined so it matches props typed as optional (engine?: AudioEngine)
    const engine = ref<AudioEngineClass | undefined>(undefined)

    function onEngineReady(instance?: AudioEngineClass) {
      engine.value = instance || AudioEngine
    }

    return { engine, onEngineReady }
  }
})
</script>

<style scoped>
#app { display: block; }
header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
main { display:flex; gap:14px; }
.left { width:320px; }
.right { flex:1; }
</style>