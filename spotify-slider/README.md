# Spotify-style slider (Tilda)

Слайдер первого экрана в духе [lifeatspotify.com](https://www.lifeatspotify.com/) для Zero Block.

## Подключение

1. Shape с классом `slider` — контейнер.
2. Карточки `.card1`, `.card2`, `.card3` (520×460), внутри заголовок + подзаголовок.
3. Код из `spotify-slider/tilda-embed.html` — в HTML-элемент Тильды.

## Поведение

- Активная карточка по центру, слева/справа — соседние (scale + лёгкое затемнение).
- Зациклено на 3 слайдах.
- Подзаголовок только у активного.
- Без flip/переворота.
- Drag/swipe, клик по боковой, автоплей 5с (пауза при hover).

## Демо

Откройте `spotify-slider/demo.html` локально.

## Замечание по заготовке

На https://form.ptsecurity.com/slider-test у третьей карточки сейчас класс `card2` вместо `card3` — поправьте на `card3`.
