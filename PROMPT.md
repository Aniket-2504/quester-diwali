# iQOO Diwali Gift Website – Master Prompt

(Paste everything below the line into Antigravity, with Claude Opus 4.6 selected.)

---

You are a senior creative developer and designer. Build a single-page Diwali gift website for iQOO.

## Files that ALREADY EXIST in this folder (do not recreate or remodel them)

```
claude-assets/
  models/iqooModels.js        <- 3D models (three.js): Q logo, gift box, jars. READ THE HEADER COMMENT FOR THE API.
  effects/fireworks.js        <- canvas fireworks: startFireworks(canvas)
  logo/iqoo-logo.svg          <- iQOO wordmark (yellow #F2B31E)
  logo/iqoo-logo.png
  reference/*.jpeg            <- photos of the real gift box (blue velvet lid, gold stripes, marble sides, gold handle, jars with mandala labels). Look at them for the visual mood.
```

Step 0: read `claude-assets/models/iqooModels.js` and `claude-assets/effects/fireworks.js` fully before writing any code.
Scaffold a Next.js (App Router, TypeScript) + Tailwind project in this folder. If create-next-app complains about existing files, scaffold in a temp folder and move the result here. Keep `claude-assets/` untouched, then move or import from it (for example copy to `src/lib/`).
Install: `three`, `@react-three/fiber`, `@react-three/drei` (only if needed), `gsap`, `lenis`.

How to use the models:
- They use `document.createElement('canvas')`, so load them only in the browser: `"use client"` components, and dynamic import with `ssr:false` for the 3D parts.
- `scene.environment = makeEnv(renderer)` and `addDefaultLights(scene)` are REQUIRED for the shiny gold and glass.
- `createGiftBox()` returns a THREE.Group. Use it with `<primitive object={box} />`. Call `box.userData.update(dt)` every frame (in `useFrame`). `box.userData.open(true)` opens the lid. `putJar(slotIndex, item)` drops a jar in, `removeJar(i)` removes it. `setSlotWorld(i)` gives the world position of a slot, useful for the fly-in arc animation.
- `createQLogo()` is the hero Q. `ITEMS` is the list of 10 jar items.
- If anything in the models looks wrong, tell me what and fix it minimally, and keep the same API.

## Design rules (very important)
- Diwali theme, premium, black background, gold (#E6BF5A) and iQOO yellow (#F2B31E) accents, deep royal blue (#1630A8) from the box.
- NO glassmorphism, NO frosted/blurred panels, NO generic SaaS card grids, NO purple gradients.
- Pick ONE distinctive typeface pair (not Inter/Roboto/Poppins). Gold on black, with generous whitespace.
- Motion: only meaningful motion. The fireworks and the 3D are the stars. No fade-up on every section.
- Fully responsive (mobile first, touch drag on 3D), 60fps, `prefers-reduced-motion` respected, keyboard accessible.

## Sections

1. **Navbar** – custom, NOT glass and NOT a card. Transparent over black with a thin gold hairline. iQOO logo (svg) at left, a few anchor links, and a "Send a gift" button at right. Mobile: clean full-screen menu.

2. **Hero** – full-screen black. A `<canvas>` with `startFireworks` fills the background (shells rise from the bottom and burst in red, blue and yellow, single or mixed, with trails). In the centre, the 3D `createQLogo()` slowly rotates, lit with a warm light, and tilts toward the mouse or touch. Below it, an iQOO Diwali tagline (write 3 options in a code comment, use the best one) and a scroll cue. Hero Q should be large and cinematic.

3. **Gift box** – the 3D `createGiftBox()` on a dark stage with a soft gold glow. It rotates slowly and the user can drag it. As the user scrolls into this section the lid opens (`box.userData.open(true)`). Short headline: build your own gift box.

4. **Jar shelf** – a row of the 10 jars from `ITEMS` (use `createJar` in small 3D canvases, or one shared canvas) with item name below each. Click a jar: it flies in an arc into the next free slot of the 3D box (`putJar`). Rules: MAX 6 jars. Show a counter "3 of 6". After 6, the other jars are disabled. Clicking a jar already in the box removes it. The "Send gift" button stays DISABLED until exactly 6 jars are chosen, then unlocks with a small gold pulse.

5. **Send flow** – "Send gift" opens a modal popup (solid dark, gold border, not glass) with: Name (required), Role (optional), Note (required, max 200 chars). Inline validation. Next step in the same modal: show the customised box (closed). Click it and it opens, showing the 6 chosen jars. Under it, a "Create gift link" button. On click, save to the database and show the unique link (`/gift/[id]`) with Copy and WhatsApp share buttons.

6. **Receiver page `/gift/[id]`** – black page with fireworks on the sides and sky. A modal popup at the top: "{Name} sent you an iQOO Diwali gift". Below it a closed gift box. Click it: it opens with the sender's jars (use `putJar(i, item, true)` or animated) and the note displayed beautifully. Handle "gift not found" gracefully.

## Data
Use Supabase (or Firebase if simpler) to store `{ id, senderName, role, note, jarIds[6], createdAt }`. The id is a short random string (nanoid, 8 chars). Never put the data in the URL. Use env variables and document the setup in README. Add basic rate-limiting or length validation on the API route.

## How to work
Do it in stages and stop to let me check after each one:
1. Project setup, tokens (colours, fonts), navbar, hero with fireworks.
2. Hero 3D Q.
3. Gift box section + jar shelf + 6-jar logic.
4. Modal + create-link flow + database.
5. Receiver page.
6. Polish, performance (lazy-load 3D, dispose geometries), accessibility, mobile pass.

Before each stage, say in 2 lines what you will build. After each stage, tell me how to run and test it.
