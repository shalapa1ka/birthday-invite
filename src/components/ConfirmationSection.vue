<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { dishes } from '../config/dishes'
import { event } from '../config/event'
import type { Guest } from '../config/guests'
import type { SavedRSVP } from '../services/rsvpApi'
import { assetUrl, eventDayMonth } from '../utils/format'

const props = defineProps<{
  guest: Guest
  result: SavedRSVP
  /** Move focus to the heading (only right after submitting, not when restoring on page load). */
  announce?: boolean
}>()
defineEmits<{ edit: [] }>()

const dish = computed(() => dishes.find((item) => item.id === props.result.dishId) ?? null)

const heading = ref<HTMLElement | null>(null)
onMounted(() => {
  if (props.announce) heading.value?.focus({ preventScroll: true })
})
</script>

<template>
  <div role="status">
    <p class="eyebrow text-paper/70">Відповідь отримано</p>

    <template v-if="result.attending">
      <h2 ref="heading" tabindex="-1" class="mt-6 font-display text-[clamp(2.75rem,10vw,4.75rem)] leading-[1.02] outline-none">
        {{ guest.name }}, усе готово.
      </h2>
      <p class="mt-6 max-w-lg text-[1.15rem] leading-relaxed text-paper/85">
        Чекатимемо на вас {{ eventDayMonth }} о {{ event.time }}.<br />
        {{ event.venue }}, {{ event.address }}.
      </p>

      <div v-if="dish" class="mt-12 flex items-center gap-5 rounded-3xl border border-paper/15 p-4 pr-6">
        <img :src="assetUrl(dish.image)" alt="" class="size-24 shrink-0 rounded-2xl object-cover sm:size-28" />
        <div>
          <p class="eyebrow text-paper/60">Ваша страва</p>
          <p class="mt-2 font-display text-2xl leading-tight">{{ dish.name }}</p>
          <p class="mt-1 text-sm text-paper/70">{{ dish.description }}</p>
        </div>
      </div>
    </template>

    <template v-else>
      <h2 ref="heading" tabindex="-1" class="mt-6 font-display text-[clamp(2.75rem,10vw,4.75rem)] leading-[1.02] outline-none">
        {{ guest.name }}, дякую за відповідь.
      </h2>
      <p class="mt-6 max-w-lg text-[1.15rem] leading-relaxed text-paper/85">
        Шкода, що цього разу не вийде. Якщо плани зміняться — просто змініть відповідь.
      </p>
    </template>

    <button type="button" class="btn btn-outline-light mt-10 w-full sm:w-auto" @click="$emit('edit')">
      Змінити відповідь
    </button>
  </div>
</template>
