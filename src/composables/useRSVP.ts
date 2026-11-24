import { computed, ref, watch } from 'vue'
import { RSVPError, fetchRSVP, sendRSVP, type RSVPErrorCode, type RSVPSubmission, type SavedRSVP } from '../services/rsvpApi'

export type Attendance = 'yes' | 'no'
export type RSVPStatus = 'loading' | 'idle' | 'submitting' | 'success' | 'error'

export function useRSVP(guestId: string) {
  const attendance = ref<Attendance | null>(null)
  const dishId = ref<string | null>(null)
  const status = ref<RSVPStatus>('loading')
  const result = ref<SavedRSVP | null>(null)
  const errorCode = ref<RSVPErrorCode | null>(null)
  const retryAfter = ref<number | null>(null)
  /** true only right after the guest pressed submit (not when an earlier answer was restored). */
  const justSubmitted = ref(false)

  const isSubmitting = computed(() => status.value === 'submitting')

  const payload = computed<RSVPSubmission | null>(() => {
    if (attendance.value === 'no') return { guestId, attending: false }
    if (attendance.value === 'yes' && dishId.value) return { guestId, attending: true, dishId: dishId.value }
    return null
  })

  const canSubmit = computed(
    () => payload.value !== null && (status.value === 'idle' || status.value === 'error'),
  )

  function prefill(saved: SavedRSVP) {
    attendance.value = saved.attending ? 'yes' : 'no'
    dishId.value = saved.dishId ?? null
  }

  // Restore a previously saved answer, so a page reload shows it instead of an empty form.
  async function load(): Promise<void> {
    try {
      const saved = await fetchRSVP(guestId)
      if (saved) {
        result.value = saved
        prefill(saved)
        status.value = 'success'
        return
      }
    } catch (error) {
      console.error('[rsvp]', error)
    }
    status.value = 'idle'
  }
  void load()

  // Changing the answer after a failed attempt clears the error message.
  watch([attendance, dishId], () => {
    if (status.value === 'error') status.value = 'idle'
  })

  async function submit(): Promise<void> {
    const submission = payload.value
    if (!submission || !canSubmit.value) return

    status.value = 'submitting'
    try {
      result.value = await sendRSVP(submission)
      justSubmitted.value = true
      status.value = 'success'
    } catch (error) {
      console.error('[rsvp]', error)
      errorCode.value = error instanceof RSVPError ? error.code : 'network'
      retryAfter.value = error instanceof RSVPError ? (error.retryAfter ?? null) : null
      status.value = 'error'
    }
  }

  /** "Змінити відповідь": back to the form, pre-filled with the saved answer. */
  function edit(): void {
    if (result.value) prefill(result.value)
    justSubmitted.value = false
    status.value = 'idle'
  }

  return { attendance, dishId, status, result, errorCode, retryAfter, justSubmitted, isSubmitting, canSubmit, submit, edit }
}
