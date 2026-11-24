/**
 * Everything about the celebration itself.
 * Edit this file to change the name, date, venue or hero photo.
 */
export const event = {
  /** Shown in the hero and in the signature. */
  celebrantName: 'Марія',
  age: 25,

  /** Format: DD.MM.YYYY */
  date: '09.12.2026',
  /** Format: HH:MM */
  time: '16:00',

  venue: 'Рибне Місце',
  address: 'просп. Гагаріна, 15, Кривий Ріг',
  mapsUrl: 'https://maps.app.goo.gl/dW9hUBuBQgy8E269A',

  /**
   * Path inside `public/` (no leading slash) or a full https:// URL.
   * Replace `public/images/hero.jpg` with a real photo (portrait, ~1200×1600).
   */
  heroImage: 'images/hero.jpg',
} as const
