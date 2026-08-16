# Spotify-style slider (Tilda)

Под заготовку [parent-new](https://project14053621.tilda.ws/parent-new).

## Подключение

1. Shape `.slider` — контейнер.
2. Слайды 1…5: `.cardN` (контент) + `.cardN-img` (оборот).
3. Пагинация: `.cslide4-N` → полоска `.slide4-N`.
4. Кнопки `.slider-prev` / `.slider-next` — скрываются, их иконки идут в курсор.
5. Код из `spotify-slider/tilda-embed.html` — в HTML-блок (заменить старую версию).

## Поведение

- Coverflow 3D + flip активной карточки (как Spotify).
- Текст на контентной стороне сразу целиком, без анимации.
- Без прозрачности карточек, зазор ≥ 16px до соседей.
- Пагинация и автоплей синхронизированы.
