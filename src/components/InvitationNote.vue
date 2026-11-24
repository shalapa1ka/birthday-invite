<script setup lang="ts">
import { event } from '../config/event'
import type { Guest } from '../config/guests'

defineProps<{ guest: Guest }>()
</script>

<template>
  <section aria-label="Особисте запрошення" class="px-5 pt-20 pb-16 sm:px-10 sm:pt-28 sm:pb-20 lg:px-16">
    <div class="mx-auto max-w-3xl">
      <p v-reveal class="eyebrow text-muted">01 — Запрошення</p>

      <div
        v-reveal="100"
        class="mt-8 flex flex-col gap-10 rounded-[1.75rem] border border-line bg-paper-dim/60 p-6 sm:gap-14 sm:p-10"
      >
        <div class="eyebrow flex items-center justify-between text-muted">
          <span>Особисте запрошення</span>
          <span>{{ event.date }}</span>
        </div>

        <p class="font-display text-[clamp(1.85rem,7vw,3rem)] leading-[1.14] text-balance">
          {{ guest.name }}, буде чудово, якщо ви розділите зі мною
          <em class="text-accent">цей вечір</em> — свято мого {{ event.age }}-річчя.
        </p>
      </div>
    </div>
  </section>
</template>
