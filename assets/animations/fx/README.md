# Canvas FX Runtime

Use Canvas FX sparingly on active slides with `data-fx`:

```html
<section class="slide" data-fx="starfield">
```

Supported FX ids:

- `particle-field`
- `starfield`
- `knowledge-graph`
- `data-stream`
- `spark-burst`

The runtime creates one hidden `<canvas class="fx-canvas">` inside the active slide, keeps intensity low, and stops animation loops when the slide is left. It also respects `prefers-reduced-motion: reduce` by not starting animated loops.
