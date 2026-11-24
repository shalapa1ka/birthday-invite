<script setup lang="ts">
import { event } from '../config/event'
import { eventDay, eventMonth, eventWeekday, eventYear } from '../utils/format'
</script>

<template>
  <section id="details" aria-labelledby="details-title" class="scroll-mt-4 px-5 pb-20 sm:px-10 sm:pb-28 lg:px-16">
    <div class="mx-auto max-w-3xl">
      <p v-reveal class="eyebrow text-muted">02 — Деталі</p>
      <h2 id="details-title" v-reveal="100" class="mt-6 font-display text-[clamp(2.5rem,9vw,4.25rem)] leading-none">
        Коли і де
      </h2>

      <dl class="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
        <!-- Date -->
        <div
          v-reveal
          class="flex aspect-square flex-col justify-between rounded-[1.75rem] border border-line bg-paper-dim/60 p-5 sm:aspect-[16/10] sm:p-7"
        >
          <dt class="eyebrow text-muted">Дата</dt>
          <dd>
            <span class="block font-display text-[clamp(2.75rem,12.5vw,4.5rem)] leading-[0.9] tracking-[-0.02em] lining-nums tabular-nums">
              {{ eventDay }}
            </span>
            <span class="mt-3 block text-[0.95rem] leading-snug text-muted">
              {{ eventMonth }}, <span class="whitespace-nowrap">{{ eventWeekday }}</span>
            </span>
            <span class="sr-only">{{ eventYear }}</span>
          </dd>
        </div>

        <!-- Time -->
        <div
          v-reveal="100"
          class="flex aspect-square flex-col justify-between rounded-[1.75rem] border border-line bg-paper-dim/60 p-5 sm:aspect-[16/10] sm:p-7"
        >
          <dt class="eyebrow text-muted">Час</dt>
          <dd>
            <span class="block font-display text-[clamp(2.75rem,12.5vw,4.5rem)] leading-[0.9] tracking-[-0.02em] lining-nums tabular-nums">
              {{ event.time }}
            </span>
            <span class="mt-3 block text-[0.95rem] leading-snug text-muted">{{ event.date }}</span>
          </dd>
        </div>

        <!-- Venue -->
        <div v-reveal="150" class="col-span-2 rounded-[1.75rem] bg-ink p-5 text-paper sm:p-7">
          <dt class="eyebrow text-paper/60">Місце</dt>
          <dd class="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <span>
              <span class="block font-display text-[clamp(1.9rem,8vw,2.75rem)] leading-[1.05]">{{ event.venue }}</span>
              <span class="mt-2 block text-[0.95rem] text-paper/70">{{ event.address }}</span>
            </span>
            <a
              :href="event.mapsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-solid-light w-full shrink-0 sm:w-auto"
            >
              Відкрити на мапі
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 1h8v8M11 1 1 11" stroke="currentColor" stroke-width="1.4" />
              </svg>
              <span class="sr-only">(відкриється в новій вкладці)</span>
            </a>
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>
