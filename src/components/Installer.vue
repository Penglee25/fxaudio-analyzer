<template>
  <div class="installer" v-if="visible">
    <div class="installer-inner">
      <div class="title">Install FxSound Web</div>
      <p>Install this app to your device for quicker access. You can also continue without installing.</p>
      <div class="actions">
        <button @click="promptInstall" :disabled="prompting">{{ prompting ? 'Installing…' : 'Install' }}</button>
        <button @click="dismiss">Skip</button>
      </div>
      <div v-if="message" class="message">{{ message }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import AudioEngine from '../audio/AudioEngine.ts'

export default defineComponent({
  name: 'Installer',
  emits: ['engine-ready'],
  setup(_, { emit }) {
    const visible = ref(true)
    const deferredPrompt = ref<any>(null)
    const prompting = ref(false)
    const message = ref('')

    onMounted(() => {
      // listen for beforeinstallprompt (PWA)
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault()
        deferredPrompt.value = e
        visible.value = true
      })

      // If no browser event, still show small installer as simulation
      // After a short delay, emit engine-ready so App knows engine can be used
      setTimeout(async () => {
        await AudioEngine.init()
        emit('engine-ready', AudioEngine)
      }, 300)
    })

    async function promptInstall() {
      if (deferredPrompt.value) {
        prompting.value = true
        try {
          deferredPrompt.value.prompt()
          const result = await deferredPrompt.value.userChoice
          message.value = result.outcome === 'accepted' ? 'Thank you — installed!' : 'Installation dismissed'
        } catch (e) {
          message.value = 'Install prompt failed or dismissed.'
        } finally {
          prompting.value = false
          visible.value = false
        }
      } else {
        // fallback simulated install
        prompting.value = true
        setTimeout(() => {
          message.value = 'App installed (simulated).'
          prompting.value = false
          visible.value = false
        }, 800)
      }
    }

    function dismiss() {
      visible.value = false
    }

    return { visible, prompting, promptInstall, dismiss, message }
  }
})
</script>

<style scoped>
.installer {
  position: absolute;
  right: 18px;
  top: 12px;
}
.installer-inner {
  background: #0f1720;
  border: 1px solid #25303a;
  padding: 10px 14px;
  border-radius: 8px;
  color: #e6eef6;
  width: 260px;
}
.installer .title { font-weight:600; margin-bottom:6px }
.installer .actions { display:flex; gap:8px; margin-top:10px }
.installer button { padding:6px 8px; background:#111827; color:#e6eef6; border-radius:6px; border:1px solid #2b3942 }
.installer .message { margin-top:8px; color:#7ee4c6 }
</style>