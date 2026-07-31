# Panorama Slider для Tilda

Бесконечная зацикленная карусель с эффектом panorama для Zero Block.

## Как вставить

1. Создайте **Zero Block**.
2. Добавьте элемент **HTML** и задайте ему CSS-класс `panorama`.
3. Скопируйте весь код из [`panorama-slider/tilda-embed.html`](panorama-slider/tilda-embed.html) в этот HTML-элемент.
4. В массиве `IMAGES` замените 10 ссылок на свои фото (**2×3**).

Пример ссылки:

```text
https://static.tildacdn.com/tild3432-3430-4661-b861-633639383164/samuelzeller168234.jpg
```

5. Фон (цвет / картинка) задайте в Zero Block — маска вырежет панорамную форму поверх фона.

## Что внутри

- Swiper 11, бесконечный `loop`, центральный слайд
- SVG-маска panorama (data-URI, без внешнего файла)
- 3D `rotateY` + глубина по progress
- Картинки с `aspect-ratio: 2 / 3`
- Стрелки и точки **снаружи** маски

## Настройка эффекта

В `tilda-embed.html` объект `PANORAMA`:

| Параметр | За что отвечает |
|---|---|
| `rotate` | поворот боковых слайдов |
| `depth` | глубина «цилиндра» |
| `scale` | уменьшение боковых фото |

## Демо

Откройте [`panorama-slider/demo.html`](panorama-slider/demo.html) в браузере.

## Файлы

- `panorama-slider/tilda-embed.html` — код для вставки в Tilda
- `panorama-slider/demo.html` — локальный превью
- `panorama-slider/panorama-mask.svg` — исходник маски
- `panorama-slider/images/` — демо-фото для превью
