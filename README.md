# Velarc — electric truck brand (portfolio concept)

A fictional premium electric-truck brand. Layout, pacing and motion follow the structure of unitedcarriers.com; every name, line of copy, logo and drawing is original.

**Stack:** plain HTML, CSS and JavaScript. No framework, no build step, no dependencies. Fonts load from Google Fonts (Saira, JetBrains Mono).

## Run it

```bash
npm start                      # → http://localhost:5173
# or
python3 -m http.server 5173    # → http://localhost:5173
```
Double-clicking `index.html` also works.

## Files

```
index.html      markup and copy
css/style.css   12-column grid, sections, responsive and reduced-motion rules
js/scene.js     original SVG artwork: tractor, chassis, containers, reach stacker, top-down truck
js/land.js      240×120 land mask for the dotted globe and maps (Natural Earth 110m, public domain)
js/main.js      loader, header states, globe, and every scroll timeline
```

## Page flow and motion

| Section | What happens on scroll |
|---|---|
| Loader | Dotted world map with a 00–100 counter, then a circular wipe |
| Hero (pinned) | Dotted globe lit orange from above and blue from below, live charging routes; title lifts away, blue glow rises |
| Intro | Blue overlap fades to white; sticky headline fills grey → black; copy lights word by word; stats count up |
| Journey (pinned, ~13 screens) | Reach stacker picks a container off a stack, turns it, loads it onto a Velarc truck → camera pulls back, ground becomes the black lineup strip that slides sideways under a giant "Our lineup" → the camera tilts to top-down and the truck drives the road, through a curved T-junction and down between white panels with features |
| Why (pinned) | Close-up of the truck from above on a blue night highway, zooming out; title blurs in, five features appear around it, clouds wipe to white |
| Operators | Long quotes light up word by word |
| Partners | Grid with crosshair corners, hover states |
| Insights | Blue arch into black, news list with hover thumbnail |
| FAQ, CTA, footer | Numbered accordion, ringed CTA, industries/services marquee, dotted map, stipple band |

The header has two states (full nav over the hero, compact "Menu" bar after) and switches between light and dark text based on the section behind it.

## Accessibility

- `prefers-reduced-motion: reduce` skips the loader and turns every pinned scene into a still, readable section.
- Skip link, focus styles, native `<details>` for the FAQ, labelled form field.
- The custom cursor only appears with a fine pointer.

## Image credits

- Operator portraits (`assets/people/`): AI-generated faces of people who do not exist, from thispersondoesnotexist.com (StyleGAN2). No real person is pictured.
- Head-office photo (`assets/head-office.jpg`): "white building" from Unsplash, used under the Unsplash License — https://unsplash.com/photos/white-building-seQbRNo90Xw
