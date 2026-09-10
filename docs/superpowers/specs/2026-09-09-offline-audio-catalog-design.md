# Offline audio catalog — design

## Goal

Provide an offline browser application for the 126 MP3 files in this folder. Each sound has a tile with a concise description of its spoken content in Polish and Ukrainian, plus playback controls.

## Architecture

The deliverable is a static site. `index.html`, `styles.css`, and `app.js` are opened locally in a browser; no backend or internet connection is required for ordinary use. Audio stays in the project folder and is referenced by a generated manifest.

A generation script scans every MP3 file, extracts duration, creates an original Ukrainian transcription, and writes a concise Ukrainian description plus its Polish equivalent into `audio-manifest.json`. The manifest is the single source of truth for the UI. Running the generator again refreshes the catalog after files are added or changed.

## User experience

The page has a Polish/Ukrainian language switch, search, a count of visible recordings, and a responsive tile grid. Every tile shows its ordinal number, friendly title, duration, selected-language description, and an accessible play/stop button. Search matches transcription and descriptions.

Only one audio element can play at once. Starting a new recording stops and resets the previous recording. Button labels and pressed state reflect playback. If audio playback or manifest data fails, the interface presents a readable message and keeps the remaining catalog usable.

## Data shape

Each manifest entry contains:

- `id`: stable identifier derived from the audio filename.
- `file`: encoded relative MP3 path.
- `title`: friendly label, initially based on sequence/order.
- `durationSeconds`: playback length.
- `transcriptUk`: original transcript.
- `descriptionUk`: concise Ukrainian summary.
- `descriptionPl`: concise Polish translation/summary.

Entries without a usable transcript have explicit fallback descriptions in both languages.

## Verification

Verify that the manifest covers all discovered MP3 files, each entry has both descriptions and a valid duration, and the static app loads the catalog. Exercise language switching, search, and single-active-track playback in a local browser context.
