# Приглашение на 25-летие

Персональное digital-приглашение: статический сайт на Vue 3 + Vite + TypeScript + Tailwind CSS. Сайт хостится на GitHub Pages. Ответы гостей сохраняет маленький Cloudflare Worker (бесплатно, без своего сервера), он же присылает уведомления в Telegram.

Каждый гость получает свою ссылку вида `https://USERNAME.github.io/REPOSITORY_NAME/?guest=<16 символов>`. Одна ссылка соответствует одному гостю, +1 не предусмотрен.

## Быстрый старт

```bash
npm install
npm run dev        # http://localhost:5173/?guest=<token из guest-links.local.txt>
npm run typecheck  # проверка TypeScript
npm run build      # production-сборка в dist/
npm run preview    # просмотр сборки
```

Если `VITE_RSVP_API` не задан, `npm run dev` сохраняет ответы в `localStorage` браузера, чтобы весь сценарий можно было проверить без Worker. В production-сборке без этой переменной гость увидит сообщение об ошибке.

## Структура

```text
guests.local.json      ← секретный список гостей и token (не в git)
guest-links.local.txt  ← готовые персональные ссылки (не в git)
scripts/guests.mjs     ← генератор src/config/guests.ts
src/
  config/        ← всё, что нужно редактировать
    event.ts     имя именинницы, дата, время, ресторан, адрес, карта, фото hero
    guests.ts    список гостей: хэш token → имя (генерируется, руками не править)
    dishes.ts    основные блюда (название, описание, вес, фото)
  components/    HeroSection, InvitationNote, EventDetails, RSVPSection,
                 DishCarousel, ConfirmationSection, InvalidLink
  composables/   useGuest (чтение ?guest=), useRSVP (состояние формы)
  services/      rsvpApi.ts (запросы к Worker)
  directives/    reveal.ts (лёгкая анимация появления при скролле)
public/images/   hero.jpg, dish-1…4.webp
worker/          Cloudflare Worker: хранение ответов (KV) + уведомления в Telegram
  src/index.ts
  wrangler.jsonc
.github/workflows/deploy.yml
```

## Как редактировать

### Гости

Настоящий список гостей с их секретными token хранится **только у вас** в `guests.local.json`. Этот файл исключён из git:

```json
{
  "siteUrl": "https://shalapa1ka.github.io/birthday-invite/",
  "guests": [
    { "name": "Інна", "token": "…" },
    { "name": "Оля" }
  ]
}
```

После изменений выполните:

```bash
npm run guests
```

Скрипт:
- выдаст новым гостям случайный token из 16 букв и цифр и сохранит его в `guests.local.json`;
- перезапишет `src/config/guests.ts`. В нём только **SHA-256-хэши** token и имена, так что файл можно публиковать;
- запишет готовые персональные ссылки в `guest-links.local.txt` (тоже исключён из git) и выведет их в консоль.

Затем задеплойте **и сайт** (push в `main`), **и Worker** (`cd worker && npm run deploy`): Worker берёт список гостей из того же `guests.ts`.

> ⚠️ Не теряйте `guests.local.json`: без него не восстановить ссылки уже приглашённых гостей. Хэш необратим. Сделайте резервную копию, например в «Избранное» в Telegram.

### Блюда

В `src/config/dishes.ts` задаются `name`, `description`, `weight` (необязательно) и `image`. Количество блюд любое: карточки выстраиваются в сетку 2×N. Фото кладите в `public/images/`; лучший формат — горизонтальное 4:3, примерно 1200×900. После изменений задеплойте и Worker (`cd worker && npm run deploy`): он берёт блюда из этого же файла.

### Цвета

Палитра сайта (Olive Grove · Rose Dust · Soft Sand) задана в `src/style.css` в блоке `@theme`: фон, светлые плитки, тёмные блоки, вторичный текст, линии и акцент.

### Дата, время, ресторан, фото

Всё это в `src/config/event.ts`: `celebrantName`, `date` (`ДД.ММ.ГГГГ`), `time` (`ЧЧ:ММ`), `venue`, `address`, `mapsUrl`, `heroImage`.

Фото для первого экрана: замените `public/images/hero.jpg`, лучше вертикальное, примерно 1200×1600. Можно указать и другой файл или полный `https://` URL.

Пути к картинкам пишите **без** ведущего `/` (`images/hero.jpg`), тогда они работают и в подпапке GitHub Pages.

## Бэкенд: Cloudflare Worker + Telegram

Сайт статический, поэтому ключи от базы или токен Telegram-бота в его код класть нельзя: код на GitHub Pages виден всем. Секреты хранит Worker в папке `worker/`. Это одна функция на Cloudflare: бесплатный тариф даёт 100 000 запросов в день, сервер поднимать не нужно.

### Как это работает

- `GET /rsvp?guest=<id>` — текущий ответ гостя. Если гость уже отвечал, при открытии ссылки он сразу видит свой ответ и кнопку **«Змінити відповідь»**. Перезагрузка страницы ничего не сбрасывает.
- `POST /rsvp` с телом `{ guestId, attending, dishId? }` — сохранить ответ. Имя гостя и название блюда Worker берёт из `src/config`, а не из запроса.
- Ответы хранятся в Workers KV (NoSQL ключ–значение): **один гость — одна запись**, повторная отправка её перезаписывает.
- В Telegram приходит сообщение о новом или изменённом ответе со сводкой: сколько придут, какие блюда, от кого ждём ответа.

### Безопасность и защита от спама

- **Token не хранятся нигде в открытом виде.** В коде сайта, в репозитории и в Worker лежат только их SHA-256-хэши. KV хранит ответы по хэшу. Подобрать token по хэшу нереально: около 95 бит случайности.
- **Секреты** (токен бота, chat id) лежат только в зашифрованных secrets Cloudflare. В коде сайта их нет.
- По token гость видит и меняет **только свой** ответ. Получить список всех ответов через API нельзя.
- Ссылка с token не передаётся сторонним сайтам: стоит `<meta name="referrer" content="no-referrer">`. Сайт закрыт от поисковиков: `noindex`.

- Принимаются только token из `guests.ts`, блюда из `dishes.ts` и запросы с вашего сайта (`ALLOWED_ORIGINS`).
- Повторная отправка того же ответа (двойной клик, перезагрузка) ничего не меняет, уведомление не приходит.
- Между изменениями ответа одного гостя минимум 30 секунд (`COOLDOWN_SECONDS`).
- Не больше 10 сохранений на гостя (`MAX_SAVES`). После этого гость увидит просьбу написать имениннице напрямую.

### 1. Создать Telegram-бота

1. Напишите [@BotFather](https://t.me/BotFather) команду `/newbot`, задайте имя и сохраните **токен** вида `123456:ABC…`.
2. Напишите своему боту любое сообщение. Если уведомления должны приходить в общий чат, добавьте бота в группу и напишите что-нибудь там.
3. Откройте `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и найдите `"chat":{"id": …}`. Это **chat id**. У групп он отрицательный, например `-100…`.

### 2. Задеплоить Worker

Нужен бесплатный аккаунт [Cloudflare](https://dash.cloudflare.com/sign-up).

```bash
cd worker
npm install
npx wrangler login                        # откроет браузер для входа в Cloudflare
npx wrangler kv namespace create RSVP     # создаст хранилище и выведет его id
```

1. Вставьте полученный `id` в `worker/wrangler.jsonc` вместо `REPLACE_WITH_KV_NAMESPACE_ID`.
2. В том же файле в `ALLOWED_ORIGINS` замените `USERNAME` на свой логин GitHub: `https://USERNAME.github.io`. Только домен, без названия репозитория.
3. Добавьте секреты. Команды по очереди спросят значения:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npm run deploy
```

После деплоя появится адрес вида `https://birthday-rsvp.<ваш-аккаунт>.workers.dev`. Это `VITE_RSVP_API`.

Проверка: `curl -H "Origin: https://USERNAME.github.io" "https://birthday-rsvp.<аккаунт>.workers.dev/rsvp?guest=<token>"` должен вернуть `{"ok":true,"rsvp":null}`.

### 3. Указать адрес Worker в проекте

Для локальной разработки:

```bash
cp .env.example .env.local
# вставьте адрес Worker в VITE_RSVP_API
```

Для GitHub Pages добавьте переменную в репозиторий (см. ниже).

### Полезное

- **Посмотреть или удалить ответы:** Cloudflare Dashboard → Storage & Databases → Workers KV → `RSVP`. Ключи вида `rsvp:<id гостя>`.
- **Логи Worker:** `cd worker && npx wrangler tail`.
- **Локальный запуск Worker:** скопируйте `worker/.dev.vars.example` в `worker/.dev.vars`, затем `cd worker && npm run dev`. API будет на `http://localhost:8787`, а для сайта укажите `VITE_RSVP_API=http://localhost:8787`.
- **Изменить лимиты:** добавьте в `vars` в `wrangler.jsonc`, например, `"COOLDOWN_SECONDS": "60"` или `"MAX_SAVES": "5"`.

## Деплой на GitHub Pages

1. Создайте репозиторий на GitHub и запушьте проект в ветку `main`:

   ```bash
   git init && git add . && git commit -m "Birthday invitation"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git
   git push -u origin main
   ```

2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions → вкладка Variables → New repository variable**:
   `VITE_RSVP_API` = адрес Worker, например `https://birthday-rsvp.<аккаунт>.workers.dev`.
4. Каждый push в `main` запускает `.github/workflows/deploy.yml`: сборка и деплой. Если вы добавили переменную уже после первого пуша, перезапустите workflow вручную: **Actions → Deploy to GitHub Pages → Run workflow**.
5. Сайт будет доступен по адресу `https://USERNAME.github.io/REPOSITORY_NAME/`.

В `vite.config.ts` указан `base: './'`: все пути к ресурсам относительные. Поэтому сборка работает и в подпапке репозитория, и на собственном домене, а название репозитория прописывать не нужно.

> Репозиторий может быть публичным: имена гостей не секретны. Но учтите, что список гостей тогда виден в исходниках.
