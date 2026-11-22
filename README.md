# The Everlands: Of Sugar and Flame

A 3D story-adventure for iPhone (and any browser), adapted chapter by chapter from the book by Elisa Espinosa Ruiz.
You play Amber, princess of Emberland, across all 17 chapters, with a free-roam epilogue once the story ends.

## Playing

- **iPhone:** open the site in Safari → Share → **Add to Home Screen**. It then launches full-screen like an app and works offline after the first load. Landscape is best.
- **Controls (touch):** left thumb moves, drag the right side to look. **◆** talks / examines, **▲** jumps, **✦** is your flame, **♪** is the ruby whistle. While riding Ruby: left thumb steers, **»** flies faster, **▽** lands.
- **Controls (keyboard):** WASD move, mouse-drag or Z/X look, E talk, Space jump, F flame, Q whistle, Shift faster, L land, J journal.
- **Stuck?** The **?** button shows the current hint and draws a glowing trail (with a beam of light at the end) to the next person or place.
- **Going inside:** every house door opens (◆ *Go inside*), and every palace tower can be climbed to its top.
- **Saving:** automatic, on the device, after every conversation and discovery. The journal (❖) holds the current goal, everything people have told you, keepsakes, chapter replay and settings.

## Design

The game follows the "knowledge is the key" school of narrative adventure: there are no map markers. People tell you things;
what they tell you is kept as *leads* in the journal, and you find the way yourself. A "nudge" is available in the journal if you are stuck.
Exploration and tools follow the classic action-adventure shape (a hub world per kingdom, abilities that open new interactions:
the flame, the whistle, the dragon), and conversations are topic-based — you choose what to ask.

Story-driven mechanics: Amber is *cold* in Sugarland until Madame Praline's coat; Kim is *too hot* in Emberland until someone offers water;
the Cinderwarden gate is a stealth beat; the First Flame hearths teach the flame; Ruby is ridden across the fog and the sea,
out of the shipwreck, out to guide the first Sugarland ship home — and in the last chapter you fly *as* Ruby into the Council's circle.

## Code map

| File | What it is |
| --- | --- |
| `src/story/part1-3.js` | The whole book as data: chapters → steps, NPC conversations, things to examine |
| `src/story/cast.js` | Character looks and the keepsake (codex) entries |
| `src/worlds.js` | Emberland, Sugarland and the sea, built procedurally (no model files) |
| `src/models.js` | People, Ruby, critters, props |
| `src/game.js` | Engine: movement, flight, camera, NPCs, script runner, saves |
| `src/ui.js` | Touch/keyboard input, dialogue box, journal |
| `src/rooms.js` | House interiors and tower tops |
| `src/cut.js` | Illustrated cut scenes |
| `src/audio.js` | Synthesised music and effects |

### Script format (for editing the story)

A script is an array. Each entry is one of:

- `'text'` narration · `['Speaker', 'text']` a spoken line
- `{ c: [['choice', [script], ok?], …], retry? }` choices (`retry` re-asks until an `ok` option is picked)
- `{ hub: [{ q, a: [script], if?, once? }], exit, need? }` ask-about-topics conversation
- `{ set: 'flag' }` · `{ if: cond, then: [...], else: [...] }` · `{ go: 'namedScript' }`
- `{ lead: 'journal text' }` · `{ give | take: 'item' }` · `{ codex: 'id' }`
- `{ cut: [...] }` an illustrated cut scene: `{ bg: 'room' }` sets the backdrop, `{ amber: 'smile' }` / `{ kim: null }` shows or hides a portrait, plain lines are spoken or narrated (see `src/cut.js`; art in `public/art/cut`)
- `{ time: 'day|dusk|night|dawn' }` · `{ tp: 'point' }` · `{ fade: 'caption' }` · `{ img: 'art-name' }`
- `{ ruby: 'arrive|leave|at', at }` · `{ fly: { rings, barks, world?, land? } }` · `{ qte: 'label' }` · `{ fx: 'name' }` · `{ mini: 'sled|balloon' }`

Each chapter step has a `goal`, a `hint`, and an `until` flag; the chapter ends when its last step's flag is set.
Point names (`at: 'orin'`) are defined in `worlds.js`.

## Development

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

Add `?ch=7` to the URL to jump straight to a chapter while testing.

The four paintings in `public/art` are the authors' own concept art.

## Graphics

- Ground materials are photo-scanned PBR textures from [Poly Haven](https://polyhaven.com) (CC0), blended per zone in `src/gfx.js`
  and tinted by the game's own palette. Buildings and props get a triplanar plaster/stone grain from the same source.
- Soft sun shadows, sky-lit reflections, animated water, wind-blown instanced grass, drifting embers, a procedural cloud deck and bloom.
- "Shadows & glow" in the journal settings turns the heavier effects off; resolution also scales down automatically if the frame rate drops.

- A storybook finish: soft ink outlines (`src/ink.js`), firelight from the nearest torches and hearths, snow, petals and ash, swaying capes and hair.

## Sculpted characters

Amber (in her gown and in Madame Praline's coat), Kim, the King, Ruby and Tira are sculpted 3D models in `public/models/hero`,
generated with Meshy from turnaround paintings of the authors' character art, then rigged and animated there
(idle, walk, run, sit, sleep, talk, cast, dance, wave). Ruby and Tira are unrigged; the game flaps Ruby's wings in a shader.
The other townsfolk still use the Quaternius packs, and buildings are assembled in code.

## Models and credits

All third-party art is CC0 (public domain):

- Quaternius — Ultimate Modular Women, Ultimate Modular Men, Medieval Village MegaKit, Stylized Nature MegaKit.
- Poly Haven — ground, plaster, roof-tile and wood textures.
- Meshy — the sculpted hero characters (generated from the authors' own art).

The cut-scene portraits and backdrops were generated from the authors' own character sheet (`docs/art`).
Voices and the three realm themes in `public/music` are generated with ElevenLabs; assignments are in `tools/cast-voices.sh`.
