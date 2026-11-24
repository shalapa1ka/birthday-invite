export interface Dish {
  id: string
  name: string
  description: string
  /** Portion weight, e.g. '320 г'. Optional. */
  weight?: string
  /** Path inside `public/` (no leading slash) or a full https:// URL. */
  image: string
}

/**
 * Main course options.
 * Also used by the RSVP Worker (worker/) — redeploy it after changing dishes.
 */
export const dishes: Dish[] = [
  {
    id: 'dish-1',
    name: 'Закрита паста з тунцем та креветками',
    description: 'Чорні вареники з тунцем, подаємо на сметанному соусі з обсмаженими креветками',
    weight: '250 г',
    image: 'images/dish-1.webp',
  },
  {
    id: 'dish-2',
    name: 'Чорна паста з креветками та мідіями',
    description:
      'Паста з чорнилом каракатиці у вершково-томатному соусі з хвостами тигрових креветок, кальмаром та мідіями у мушлях',
    weight: '320 г',
    image: 'images/dish-2.webp',
  },
  {
    id: 'dish-3',
    name: 'Котлета по-київськи з форелі',
    description: 'Котлета з філе форелі в паніровці з вершковим маслом і зеленню, картопляне пюре, стружка тунця',
    weight: '320 г',
    image: 'images/dish-3.webp',
  },
  {
    id: 'dish-4',
    name: 'Філе дорадо з птітімом',
    description: 'Обсмажене філе дорадо на птітімі у вершково-сирному соусі з тобіко',
    weight: '250 г',
    image: 'images/dish-4.webp',
  },
]
