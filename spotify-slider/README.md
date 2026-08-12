# Spotify-style slider (Tilda)

Слайдер первого экрана в духе [lifeatspotify.com](https://www.lifeatspotify.com/) для Zero Block.

## Подключение

1. Shape с классом `slider` — контейнер.
2. Карточки `.card1` … `.card5` (520×460), внутри заголовок + подзаголовок.
3. Код из `spotify-slider/tilda-embed.html` — в HTML-элемент Тильды (заменить предыдущую версию).

## Поведение

- Coverflow 3D (`rotateY` + `translateZ`), как у Spotify.
- Активная по центру, слева и справа по две карточки.
- Стили Тильды сохраняются (`#rec…` → `.pt-scope-rec…`).
- Подзаголовок только у активного.
- Левая/правая половина: курсор-стрелка и клик prev/next.
- Зациклено, без flip; swipe, автоплей 5с.

## Демо

`spotify-slider/demo.html`
