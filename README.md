# Tilda

Кастомные сниппеты для сайта на Tilda.

## random-squares-hover

Анимация SVG-иконки «случайные квадраты» по ховеру на карточку в Zero Block.

- `random-squares-hover/random-squares-hover.html` — готовый код для вставки в Tilda
  (Настройки сайта → Ещё → HTML-код для вставки внутрь BODY, либо блок T123 на странице).
- `random-squares-hover/random-squares-hover.js` — тот же скрипт отдельным файлом.
- `random-squares-hover/icon-card2.html` — SVG-иконка для второй карточки (`card-animation2`)
  с уже проставленными классами; отдельный скрипт для неё не нужен.
- `random-squares-hover/icon-card3.html` — SVG-иконка для третьей карточки (`card-animation3`)
  в том же формате.
- `random-squares-hover/demo.html` — локальная демо-страница со всеми тремя карточками.

Требования к разметке:

- у группы-карточки в Zero Block в поле CSS Class указан класс, начинающийся
  с `card-animation` (подходят `card-animation1`, `card-animation2` и т.д.);
- внутри карточки лежит HTML-элемент с `<svg class="random-squares-icon">`,
  где квадраты — это `<rect class="sq">`.

Скрипт использует делегирование событий на `document`, поэтому анимация
продолжает работать после перерисовки Zero Block (ресайз, смена брейкпоинта).
