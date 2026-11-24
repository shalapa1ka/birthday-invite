<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { dishes } from '../config/dishes'
import { assetUrl } from '../utils/format'

const selected = defineModel<string | null>({ required: true })
defineProps<{ disabled?: boolean }>()

const pad = (value: number) => String(value).padStart(2, '0')

const track = ref<HTMLElement | null>(null)
const active = ref(0)

function slideAt(index: number): HTMLElement | null {
  const child = track.value?.children[index]
  return child instanceof HTMLElement ? child : null
}

function onScroll() {
  const el = track.value
  if (!el) return
  const center = el.scrollLeft + el.clientWidth / 2
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  dishes.forEach((_, i) => {
    const slide = slideAt(i)
    if (!slide) return
    const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center)
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  })
  active.value = best
}

function go(index: number) {
  const el = track.value
  const target = Math.max(0, Math.min(dishes.length - 1, index))
  const slide = slideAt(target)
  if (!el || !slide) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollTo({
    left: slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2,
    behavior: reduceMotion ? 'auto' : 'smooth',
  })
  active.value = target
}

// When editing a saved answer, start the carousel at the chosen dish.
onMounted(() => {
  const index = dishes.findIndex((dish) => dish.id === selected.value)
  const el = track.value
  const slide = slideAt(index)
  if (index <= 0 || !el || !slide) return
  el.scrollLeft = slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2
  active.value = index
})
</script>

<template>
  <fieldset :disabled="disabled" class="min-w-0">
    <legend class="eyebrow text-paper/70">Оберіть основну страву</legend>

    <div class="-mx-5 mt-6 sm:-mx-10 lg:mx-0">
      <ul
        ref="track"
        aria-roledescription="карусель"
        class="relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pt-2 pb-4 [scrollbar-width:none] sm:px-10 lg:px-1 [&::-webkit-scrollbar]:hidden"
        @scroll.passive="onScroll"
      >
        <li
          v-for="(dish, i) in dishes"
          :key="dish.id"
          :aria-label="`Страва ${i + 1} з ${dishes.length}`"
          class="flex w-[80%] max-w-[22rem] shrink-0 snap-center"
        >
          <label
            class="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-paper/12 bg-ink-soft text-paper transition duration-300 ease-out-soft has-checked:border-paper has-checked:bg-paper has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-paper active:scale-[0.985]"
            :class="active === i ? 'opacity-100' : 'opacity-55'"
          >
            <input v-model="selected" type="radio" name="dish" :value="dish.id" class="sr-only" @focus="go(i)" @change="go(i)" />

            <!-- Photo: no text over it except two small chips -->
            <span class="relative block aspect-[5/4] shrink-0 overflow-hidden bg-ink">
              <img
                :src="assetUrl(dish.image)"
                alt=""
                draggable="false"
                loading="lazy"
                class="h-full w-full object-cover transition duration-700 ease-out-soft group-hover:scale-[1.03]"
              />
              <span class="absolute inset-x-3 top-3 flex justify-between">
                <span class="chip">{{ pad(i + 1) }} / {{ pad(dishes.length) }}</span>
                <span v-if="dish.weight" class="chip">{{ dish.weight }}</span>
              </span>
            </span>

            <!-- Text panel -->
            <span class="flex flex-1 flex-col px-5 pt-5 pb-5">
              <span class="block font-display text-[1.5rem] leading-[1.15] text-balance">{{ dish.name }}</span>
              <span class="mt-2 line-clamp-3 text-[0.92rem] leading-relaxed opacity-70">{{ dish.description }}</span>
              <span class="mt-auto pt-5">
                <span
                  class="inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition duration-300"
                  :class="selected === dish.id ? 'bg-ink text-paper' : 'border border-paper/35'"
                >
                  <svg v-if="selected === dish.id" aria-hidden="true" class="size-3.5" viewBox="0 0 14 14" fill="none">
                    <path d="m2 7.5 3.2 3L12 3.5" stroke="currentColor" stroke-width="1.8" />
                  </svg>
                  {{ selected === dish.id ? 'Обрано' : 'Обрати' }}
                </span>
              </span>
            </span>
          </label>
        </li>
      </ul>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <div class="flex">
        <button
          v-for="(dish, i) in dishes"
          :key="dish.id"
          type="button"
          class="grid h-11 place-items-center px-1.5"
          :aria-label="`Показати страву ${i + 1}`"
          :aria-current="active === i"
          @click="go(i)"
        >
          <span
            class="block h-1.5 rounded-full transition-all duration-300"
            :class="[active === i ? 'w-7 bg-paper' : 'w-1.5 bg-paper/30', selected === dish.id && active !== i ? 'bg-paper/80' : '']"
          />
        </button>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          aria-label="Попередня страва"
          class="grid size-12 place-items-center rounded-full border border-paper/25 transition hover:border-paper disabled:opacity-30"
          :disabled="active === 0"
          @click="go(active - 1)"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M13 7H1m0 0 5.5-5.5M1 7l5.5 5.5" stroke="currentColor" stroke-width="1.4" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Наступна страва"
          class="grid size-12 place-items-center rounded-full border border-paper/25 transition hover:border-paper disabled:opacity-30"
          :disabled="active === dishes.length - 1"
          @click="go(active + 1)"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12m0 0L7.5 1.5M13 7l-5.5 5.5" stroke="currentColor" stroke-width="1.4" />
          </svg>
        </button>
      </div>
    </div>
  </fieldset>
</template>
