# iQOO Diwali — Single-Page 3D Celebration Website 🪔

A festive 3D gift-building experience crafted for **iQOO**, celebrating Diwali with procedural Three.js models, interactive fireworks, and bespoke celebration hampers.

---

## ✨ Features

1. **Hero Section**:
   - Fullscreen fireworks simulation (`startFireworks`) over pure black with fading sparks and trails.
   - Interactive 3D iQOO "Q" logo (`createQLogo`) rendered in WebGL with ambient gold illumination, continuous slow majestic yaw, and responsive pointer/touch tilt physics.
   - Cinematic Diwali typography set in *Cormorant Garamond* and *Outfit*.

2. **Custom Gift Box Stage**:
   - Procedural 3D Diwali Box (`createGiftBox`) modeled after the real-world commemorative box: royal blue velvet lid, gold racing stripes, veined marble casing, and gold latch.
   - Scroll-triggered automatic lid opening revealing the inner greeting *"WISHES YOU A HAPPY DIWALI"*.
   - Free 3D touch & mouse drag rotation with inertia damping.

3. **10-Jar Shelf**:
   - 10 artisan treats from `ITEMS`: Roasted Cashews, Kaju Katli, Motichoor Ladoo, Masala Cranberry, Dried Kiwi, Mocha Cashews, Almond Chikki, Soan Papdi, Pan Shot, and Dry Fruit Mix.
   - Individual 3D jar previews featuring instanced candy particles, golden mandala lids, and clearcoat glass.
   - Real-time physics drop animation (`box.userData.putJar`) when items are selected.
   - Strict 6-jar limit with live slot indicators and counter ("X of 6").
   - Gated "Send Gift" action button that unlocks with an animated golden pulse when exactly 6 treats are selected.

4. **Sender Modal & Custom Box Reveal**:
   - Solid luxury dark modal with gold hairline borders (strictly zero glassmorphism).
   - Step 1: Form validation for Sender Name, optional Role, and Diwali greeting (max 200 chars).
   - Step 2: Interactive closed box preview — clicking opens the box to reveal the customized hamper.
   - Step 3: Instant unique 8-character shareable link (`/gift/[id]`), with 1-click clipboard copy and direct WhatsApp sharing.

5. **Receiver Experience (`/gift/[id]`)**:
   - Dedicated celebration page with fireworks filling the sky.
   - Delivery banner announcing who sent the gift.
   - Closed 3D box that pops open upon click, revealing the sender's custom treats and heartfelt message.
   - Graceful 404 fallback if an invalid gift link is visited.

6. **Performance & Accessibility**:
   - Smooth inertia scrolling powered by **Lenis**.
   - Automatic geometry and texture disposal on unmount to prevent WebGL memory leaks.
   - Full support for `prefers-reduced-motion` across fireworks and 3D animations.
   - Keyboard navigation with WCAG AAA compliant gold focus rings.

---

## 🎨 Design System & Color Tokens

- **Background**: `#000000` (Deep obsidian black)
- **Gold Accent**: `#E6BF5A` (Rich warm diwali gold)
- **iQOO Yellow**: `#F2B31E` (Brand yellow accent)
- **Royal Blue**: `#1630A8` (Box velvet exterior)
- **Typography**:
  - Headings: *Cormorant Garamond* (Serif)
  - Body: *Outfit* (Geometric sans-serif)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 🗄️ Database Setup (Supabase)

The app comes with an automated **in-memory fallback** store so it works completely out of the box with zero configuration!

To persist gifts in **Supabase**:

### 1. Create a Supabase Project
Create a free project at [supabase.com](https://supabase.com).

### 2. Create the `gifts` Table
In your Supabase SQL Editor, run:

```sql
create table gifts (
  id text primary key,
  sender_name text not null,
  role text,
  note text not null,
  jar_ids jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table gifts enable row level security;

-- Allow public read access (for recipients viewing /gift/[id])
create policy "Allow public read"
  on gifts for select
  using (true);

-- Allow public insert access (for senders creating gifts)
create policy "Allow public insert"
  on gifts for insert
  with check (true);
```

### 3. Add Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

---

## 📂 Project Structure

```
├── claude-assets/          # Original reference images, models, effects, and logo
├── src/
│   ├── app/
│   │   ├── api/gift/       # POST (create gift with rate limiting & validation)
│   │   ├── api/gift/[id]/  # GET (fetch gift by 8-char nanoid)
│   │   ├── gift/[id]/      # Receiver page route with dynamic metadata
│   │   ├── globals.css     # Design tokens, Tailwind v4 imports, keyframes
│   │   ├── layout.tsx      # Root layout, fonts, Lenis smooth scrolling
│   │   └── page.tsx        # Single-page home route
│   ├── components/
│   │   ├── Fireworks.tsx          # Canvas fireworks wrapper
│   │   ├── GiftBoxCanvas.tsx      # 3D Gift Box with drag controls & lid animation
│   │   ├── GiftBuilderSection.tsx # 6-jar builder section & status
│   │   ├── GiftNotFound.tsx       # Graceful 404 state
│   │   ├── Hero.tsx               # Fullscreen hero with fireworks & 3D Q
│   │   ├── HeroQCanvas.tsx        # 3D iQOO Q logo with pointer tilt
│   │   ├── JarShelf.tsx           # 10-jar scrollable shelf & counter
│   │   ├── JarThumbnail.tsx       # 3D preview card for each treat
│   │   ├── Navbar.tsx             # Hairline nav with accessible mobile menu
│   │   ├── ReceiverGiftClient.tsx # Unwrapping receiver flow
│   │   ├── SendGiftModal.tsx      # 3-step solid dark send modal
│   │   └── SmoothScroll.tsx       # Lenis smooth scroll provider
│   ├── fonts/              # Self-hosted woff2 fonts (Cormorant & Outfit)
│   ├── lib/
│   │   ├── db.ts           # Supabase client + local in-memory fallback
│   │   ├── fireworks.js    # Canvas particle fireworks engine
│   │   └── iqooModels.js   # Procedural Three.js 3D models (Q, Box, Jars)
│   └── types/
│       └── gift.ts         # TypeScript definitions
└── README.md
```

---

## 📜 License
Created for iQOO Diwali Celebration. Procedural 3D models and creative direction inspired by the commemorative iQOO Diwali gift box.
