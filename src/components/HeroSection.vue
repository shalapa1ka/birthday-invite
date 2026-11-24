<script setup lang="ts">
import { ref } from 'vue'
import { event } from '../config/event'
import type { Guest } from '../config/guests'
import { assetUrl } from '../utils/format'

defineProps<{ guest: Guest }>()

const photoFailed = ref(false)
</script>

<template>
  <header class="bg-paper p-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:p-4 lg:p-5">
    <div
      class="relative isolate overflow-hidden rounded-[2rem] bg-ink text-paper lg:grid lg:min-h-[calc(100svh-2.5rem)] lg:grid-cols-[1.05fr_1fr]"
    >
      <!-- Photo tile -->
      <figure
        class="relative m-2.5 h-[50svh] min-h-72 overflow-hidden rounded-[1.5rem] bg-ink-soft sm:m-3 lg:order-2 lg:h-auto"
      >
        <img
          v-if="!photoFailed"
          :src="assetUrl(event.heroImage)"
          alt=""
          class="hero-photo h-full w-full object-cover"
          fetchpriority="high"
          @error="photoFailed = true"
        />
        <div
          aria-hidden="true"
          class="hero-scrim absolute inset-0"
        />
        <div class="enter absolute inset-x-3 top-3 flex justify-between">
          <span class="chip">Запрошення</span>
          <span class="chip">{{ event.date }}</span>
        </div>
      </figure>

      <!-- Text -->
      <div class="relative z-10 -mt-36 flex flex-col px-5 pb-6 sm:px-8 sm:pb-8 lg:mt-0 lg:justify-end lg:px-12 lg:py-12">
        <p class="enter eyebrow mb-4 text-paper/85" style="--enter-delay: 150ms">
          {{ guest.name }}, це запрошення для вас
        </p>

        <h1 class="enter" style="--enter-delay: 250ms">
          <span class="sr-only">{{ event.celebrantName }}, {{ event.age }}</span>
          <span
            aria-hidden="true"
            class="-ml-[0.06em] block font-display text-[clamp(9.5rem,52vw,22rem)] leading-[0.78] font-normal tracking-[-0.04em] lining-nums"
          >
            {{ event.age }}
          </span>
          <span
            aria-hidden="true"
            class="mt-[0.3em] block font-display text-[clamp(2.75rem,11vw,5rem)] leading-none italic"
          >
            {{ event.celebrantName }}
          </span>
        </h1>

        <div class="enter mt-8 max-w-md" style="--enter-delay: 400ms">
          <div class="flex items-center gap-4 border-t border-paper/20 pt-5">
            <p class="font-display text-2xl tracking-wide lining-nums">{{ event.date }}</p>
            <span class="h-px flex-1 bg-paper/20" aria-hidden="true" />
            <p class="eyebrow">{{ event.time }}</p>
          </div>
          <p class="mt-5 text-[1.05rem] leading-relaxed text-paper/80">
            Чверть століття, один вечір і найрідніші люди поруч. Приходьте відсвяткувати його разом зі мною.
          </p>
        </div>

        <div class="enter mt-8 flex flex-col gap-3 sm:flex-row" style="--enter-delay: 550ms">
          <a href="#details" class="btn btn-solid-light">
            Деталі
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12m0 0L1.5 7.5M7 13l5.5-5.5" stroke="currentColor" stroke-width="1.4" />
            </svg>
          </a>
          <a href="#rsvp" class="btn btn-outline-light">Відповісти на запрошення</a>
        </div>
      </div>
    </div>
  </header>
</template>
