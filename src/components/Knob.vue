<template>
  <div class="knob" :style="{ width: size + 'px', height: size + 'px' }" @pointerdown.prevent="onPointerDown">
    <svg :width="size" :height="size" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stop-color="#6ee7b7" />
          <stop offset="1" stop-color="#34d399" />
        </linearGradient>
      </defs>

      <!-- background plate -->
      <circle cx="50" cy="50" r="44" fill="#0b1220" stroke="#222831" stroke-width="2"></circle>

      <!-- arc for indicator -->
      <path
        v-if="angleRange"
        :d="arcPath"
        fill="none"
        stroke="url(#g)"
        stroke-width="6"
        stroke-linecap="round"
      ></path>

      <!-- knob marker -->
      <g :transform="'rotate(' + angle + ' 50 50)'">
        <rect x="48.5" y="12" width="3" height="20" rx="1.5" fill="#e6eef6" />
      </g>

      <!-- center -->
      <circle cx="50" cy="50" r="30" fill="#111827" />
      <circle cx="50" cy="50" r="28" fill="rgba(255,255,255,0.02)" />
    </svg>
    <div class="label">{{ label }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref } from 'vue'

export default defineComponent({
  name: 'Knob',
  props: {
    modelValue: { type: Number as PropType<number>, required: true },
    min: { type: Number as PropType<number>, default: 0 },
    max: { type: Number as PropType<number>, default: 1 },
    step: { type: Number as PropType<number>, default: 0.01 },
    size: { type: Number as PropType<number>, default: 64 },
    label: { type: String as PropType<string>, default: '' },
    // angle extents in degrees (start to end). Default -135...135
    startAngle: { type: Number as PropType<number>, default: -135 },
    endAngle: { type: Number as PropType<number>, default: 135 }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const angle = computed(() => {
      const pct = (props.modelValue - props.min) / (props.max - props.min)
      return props.startAngle + pct * (props.endAngle - props.startAngle)
    })

    // produce an arc path from startAngle to current angle
    const angleRange = computed(() => props.endAngle - props.startAngle)
    const radius = 40
    function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
      const rad = (deg - 90) * (Math.PI / 180.0)
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      }
    }
    const arcPath = computed(() => {
      const start = polarToCartesian(50, 50, radius, props.startAngle)
      const end = polarToCartesian(50, 50, radius, angle.value)
      const largeArcFlag = Math.abs(angle.value - props.startAngle) <= 180 ? '0' : '1'
      return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
    })

    const active = ref(false)

    function setValueFromPointer(ev: PointerEvent) {
      const target = (ev.target as HTMLElement).closest('.knob') as HTMLElement | null
      const rect = (target ?? (ev.target as HTMLElement)).getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = ev.clientX - cx
      const dy = ev.clientY - cy
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90
      if (deg > 180) deg -= 360
      // clamp to [startAngle, endAngle]
      if (deg < props.startAngle) deg = props.startAngle
      if (deg > props.endAngle) deg = props.endAngle
      const pct = (deg - props.startAngle) / (props.endAngle - props.startAngle)
      let val = props.min + pct * (props.max - props.min)
      // snap to step
      const stepped = Math.round(val / props.step) * props.step
      val = Math.max(props.min, Math.min(props.max, Number(stepped.toFixed(5))))
      emit('update:modelValue', val)
    }

    function onPointerDown(e: PointerEvent) {
      (e.target as Element).setPointerCapture?.(e.pointerId)
      active.value = true
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp, { once: true })
      setValueFromPointer(e)
    }

    function onPointerMove(e: PointerEvent) {
      if (!active.value) return
      setValueFromPointer(e)
    }

    function onPointerUp(e: PointerEvent) {
      active.value = false
      window.removeEventListener('pointermove', onPointerMove)
    }

    return { angle: angle as any, arcPath, angleRange, onPointerDown, label: props.label }
  }
})
</script>

<style scoped>
.knob { display:inline-flex; flex-direction:column; align-items:center; user-select:none; touch-action:none }
.label { font-size:12px; color:#9aa3b2; margin-top:6px; text-align:center; width:100% }
svg { display:block }
</style>