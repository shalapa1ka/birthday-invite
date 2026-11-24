<script setup lang="ts">
import EventDetails from './components/EventDetails.vue'
import HeroSection from './components/HeroSection.vue'
import InvalidLink from './components/InvalidLink.vue'
import InvitationNote from './components/InvitationNote.vue'
import RSVPSection from './components/RSVPSection.vue'
import { event } from './config/event'
import { useGuest } from './composables/useGuest'

const { guest } = useGuest()

document.title = guest ? `${event.celebrantName} · ${event.age} · Запрошення` : 'Запрошення'
</script>

<template>
  <template v-if="guest">
    <HeroSection :guest="guest" />
    <main>
      <InvitationNote :guest="guest" />
      <EventDetails />
      <RSVPSection :guest="guest" />
    </main>
    <footer class="bg-ink px-5 pt-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-paper/50 sm:px-10 lg:px-16">
      <div class="mx-auto flex max-w-3xl items-center justify-between border-t border-paper/10 pt-6 eyebrow">
        <span>{{ event.celebrantName }}</span>
        <span>{{ event.date }}</span>
      </div>
    </footer>
  </template>
  <InvalidLink v-else />
</template>
