# Grove Sprite

A short dusk-woodland platformer you can play in the browser. You are a small forest spirit heading home to the ancient tree.

## Play locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Controls

- **Move:** Arrow keys or `A` / `D`
- **Jump:** Space, `W`, or Up
- **Leaf glide:** hold jump while in the air
- **Start / continue / replay:** Enter or click

Collect fireflies, avoid thorns and beetles, touch the mushroom checkpoint, then reach the glowing tree.

## Share a URL

This is a static site. Anyone can play it without installing anything.

```bash
npm run build
```

That writes files into `dist/`. Host that folder on any static host:

- **Netlify:** drag the `dist` folder onto [Netlify Drop](https://app.netlify.com/drop), or connect the repo and set the build command to `npm run build` and the publish directory to `dist`.
- **GitHub Pages:** enable Pages on the repo and publish the `dist` folder (the Vite config already uses a relative `base: "./"` so it works from a project site path).

After deploy, share the public URL. No backend is required.
