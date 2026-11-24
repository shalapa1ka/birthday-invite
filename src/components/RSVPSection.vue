<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { event } from '../config/event'
import type { ResolvedGuest } from '../composables/useGuest'
import { useRSVP, type Attendance } from '../composables/useRSVP'
import ConfirmationSection from './ConfirmationSection.vue'
import DishCarousel from './DishCarousel.vue'

const props = defineProps<{ guest: ResolvedGuest }>()

const { attendance, dishId, status, result, errorCode, retryAfter, justSubmitted, isSubmitting, canSubmit, submit, edit } =
  useRSVP(props.guest.token)

const options: { value: Attendance; label: string; word: string; caption: string }[] = [
  { value: 'yes', label: 'Так, буду', word: 'Так', caption: 'буду з радістю' },
  { value: 'no', label: 'На жаль, не зможу', word: 'Ні', caption: 'на жаль, не\u00a0зможу' },
]

const submitLabel = computed(() => {
  if (isSubmitting.value) return 'Надсилаємо…'
  if (status.value === 'error') return 'Спробувати ще раз'
  return attendance.value === 'yes' ? 'Підтвердити' : 'Надіслати відповідь'
})

const errorMessage = computed(() => {
  switch (errorCode.value) {
    case 'too_soon':
      return `Ви щойно змінювали відповідь. Спробуйте ще раз${retryAfter.value ? ` за ${retryAfter.value} с` : ' трохи згодом'}.`
    case 'too_many_changes':
      return `Відповідь змінювали вже надто багато разів. Напишіть, будь ласка, ${event.celebrantName} напряму.`
    default:
      return 'Не вдалося надіслати відповідь. Перевірте підключення до інтернету та спробуйте ще раз.'
  }
})

const needsDish = computed(() => attendance.value === 'yes' && !dishId.value)

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** After "Так" the dish carousel appears — bring it into view. */
function scrollToDishes(el: Element) {
  if (!(el instanceof HTMLElement) || !el.hasAttribute('data-dishes')) return
  requestAnimationFrame(() => el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }))
}

const sectionEl = ref<HTMLElement | null>(null)

function scrollToSection() {
  sectionEl.value?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

// After a successful submit show the confirmation from its top (not when a saved answer is restored on load).
watch(status, async (value) => {
  if (value !== 'success' || !justSubmitted.value) return
  await nextTick()
  scrollToSection()
})

async function startEdit() {
  edit()
  await nextTick()
  scrollToSection()
}
</script>

<template>
  <section
    id="rsvp"
    ref="sectionEl"
    aria-labelledby="rsvp-title"
    class="scroll-mt-0 bg-ink px-5 py-24 text-paper sm:px-10 sm:py-32 lg:px-16"
  >
    <div class="mx-auto max-w-3xl">
      <Transition name="swap" mode="out-in">
        <div v-if="status === 'loading'" key="loading" aria-busy="true">
          <p class="eyebrow text-paper/70">03 — Відповідь</p>
          <p class="mt-6 flex items-center gap-3 text-paper/70">
            <span aria-hidden="true" class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            Завантажуємо вашу відповідь…
          </p>
        </div>

        <ConfirmationSection
          v-else-if="status === 'success' && result"
          key="done"
          :guest="guest"
          :result="result"
          :announce="justSubmitted"
          @edit="startEdit"
        />

        <form v-else key="form" novalidate :aria-busy="isSubmitting" @submit.prevent="submit">
          <p v-reveal class="eyebrow text-paper/70">03 — Відповідь</p>
          <h2 id="rsvp-title" v-reveal="100" class="mt-6 font-display text-[clamp(2.5rem,9vw,4.25rem)] leading-[1.02]">
            Ви зможете прийти?
          </h2>

          <fieldset v-reveal="200" :disabled="isSubmitting" class="mt-10 min-w-0">
            <legend class="sr-only">Ви зможете прийти?</legend>
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <label
                v-for="option in options"
                :key="option.value"
                class="group relative flex aspect-[4/5] cursor-pointer flex-col justify-between overflow-hidden rounded-[1.75rem] border border-paper/20 p-5 transition duration-500 ease-out-soft hover:border-paper/50 has-checked:border-paper has-checked:bg-paper has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-paper has-disabled:cursor-default active:scale-[0.98] sm:aspect-[5/4] sm:p-7"
                :class="attendance && attendance !== option.value ? 'opacity-45 hover:opacity-80' : ''"
              >
                <input
                  v-model="attendance"
                  type="radio"
                  name="attendance"
                  :value="option.value"
                  :aria-label="option.label"
                  class="sr-only"
                />

                <span class="flex items-start justify-between gap-3">
                  <span class="eyebrow pt-2 tabular-nums opacity-50">{{ option.value === 'yes' ? '01' : '02' }}</span>
                  <span
                    aria-hidden="true"
                    class="grid size-8 shrink-0 place-items-center rounded-full border border-current/40 transition duration-300 group-has-checked:border-ink group-has-checked:bg-ink"
                  >
                    <svg
                      class="size-3.5 scale-50 text-paper opacity-0 transition duration-300 group-has-checked:scale-100 group-has-checked:opacity-100"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path d="m2 7.5 3.2 3L12 3.5" stroke="currentColor" stroke-width="1.8" />
                    </svg>
                  </span>
                </span>

                <span aria-hidden="true">
                  <span class="block font-display text-[clamp(3.75rem,17vw,6.5rem)] leading-[0.9] tracking-[-0.02em]">
                    {{ option.word }}
                  </span>
                  <span class="mt-3 block text-[0.95rem] leading-snug opacity-70">{{ option.caption }}</span>
                </span>
              </label>
            </div>
          </fieldset>

          <Transition name="swap" mode="out-in" @enter="scrollToDishes">
            <div v-if="attendance === 'yes'" key="yes" data-dishes class="mt-14 scroll-mt-6">
              <DishCarousel v-model="dishId" :disabled="isSubmitting" />
            </div>
            <p v-else-if="attendance === 'no'" key="no" class="mt-10 max-w-lg text-[1.05rem] leading-relaxed text-paper/80">
              Дуже шкода, що не вийде. Дякую, що попередили. Якщо плани зміняться — відповідь можна буде змінити за цим же
              посиланням.
            </p>
          </Transition>

          <Transition name="swap">
            <div v-if="attendance" class="mt-12 border-t border-paper/15 pt-8">
              <p v-if="status === 'error'" role="alert" class="mb-6 rounded-2xl bg-accent/90 px-5 py-4 text-[0.95rem] leading-relaxed text-paper">
                {{ errorMessage }}
              </p>

              <button
                type="submit"
                class="btn btn-solid-light w-full sm:w-auto sm:min-w-64"
                :disabled="!canSubmit"
                :aria-describedby="needsDish ? 'dish-hint' : undefined"
              >
                <span
                  v-if="isSubmitting"
                  aria-hidden="true"
                  class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                />
                {{ submitLabel }}
              </button>

              <p id="dish-hint" aria-live="polite" class="mt-4 min-h-6 text-sm text-paper/70">
                <template v-if="needsDish">Оберіть страву, щоб підтвердити участь.</template>
              </p>
            </div>
          </Transition>
        </form>
      </Transition>
    </div>
  </section>
</template>
