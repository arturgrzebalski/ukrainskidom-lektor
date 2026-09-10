import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { textFor, formatDuration, filterEntries, groupForEntry, statusText, renderStatus } from '../app.js';

const entries = [
  {
    title: 'Nagranie 001',
    transcriptUk: 'Розмова про подорож до Києва',
    descriptionUk: 'Опис українською про подорож',
    descriptionPl: 'Polski opis podróży',
  },
  {
    title: 'Nagranie 002',
    transcriptUk: 'Ранкова розмова',
    descriptionUk: 'Інший запис',
    descriptionPl: 'Opis o kawie',
  },
];

test('does not expose removed recording 032 and orders service groups L, M, O, P', async () => {
  const manifest = JSON.parse(await readFile(new URL('../audio-manifest.json', import.meta.url), 'utf8'));
  const files = await readFile(new URL('../audio-manifest.js', import.meta.url), 'utf8');

  assert.equal(manifest.some((entry) => entry.id === 'track-032'), false);
  assert.equal(manifest.some((entry) => entry.id === 'track-126'), false);
  assert.equal(files.includes('track-032'), false);
  assert.equal(files.includes('track-126'), false);
  await assert.rejects(access(new URL('../ElevenLabs_2026-09-09T08_56_38_Solomiya%20Vitlitska%20-%20Podcast%20Pro_pvc_sp73_s90_sb40_se0_b_m2.mp3', import.meta.url)));
  await assert.rejects(access(new URL('../ElevenLabs_2026-09-09T09_36_15_Solomiya%20Vitlitska%20-%20Podcast%20Pro_pvc_sp70_s94_sb40_se0_b_m2.mp3', import.meta.url)));
  assert.equal(groupForEntry({ transcriptUk: 'Запрошуємо номер М-0-1.' }), 'M');
  assert.equal(groupForEntry({ transcriptUk: 'Запрошуємо номер П-0-1.' }), 'P');
  assert.equal(groupForEntry({ transcriptUk: 'Запрошуємо номер «О-009»' }), 'O');
  assert.equal(groupForEntry({ transcriptUk: 'Інформація про прийом.' }), 'Pozostałe');
});

test('uses the replacement O-009 file and adds L-025 plus M-011', async () => {
  const manifest = JSON.parse(await readFile(new URL('../audio-manifest.json', import.meta.url), 'utf8'));
  const byId = Object.fromEntries(manifest.map((entry) => [entry.id, entry]));

  assert.equal(byId['track-070'].file, 'O009.mp3');
  assert.equal(byId['track-l025'].file, 'L025.mp3');
  assert.equal(byId['track-m011'].file, 'M011.mp3');
  assert.equal(groupForEntry(byId['track-l025']), 'L');
  assert.equal(groupForEntry(byId['track-m011']), 'M');
});

test('loads the manifest before an inline module runtime', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const manifestScript = html.indexOf('src="audio-manifest.js"');
  const inlineModule = html.indexOf('<script type="module">');

  assert.ok(manifestScript >= 0, 'index.html should load audio-manifest.js');
  assert.equal(
    /<script\s+type="module"\s+src="app\.js"\s*><\/script>/.test(html),
    false,
    'index.html should not load app.js as an external module',
  );
  assert.ok(inlineModule >= 0, 'index.html should contain an inline module runtime');
  assert.ok(manifestScript < inlineModule, 'audio-manifest.js should load before the inline runtime');
  assert.ok(
    html.slice(inlineModule).includes('globalThis.AUDIO_MANIFEST'),
    'the inline runtime should read globalThis.AUDIO_MANIFEST',
  );
});

test('inline runtime preserves button focus and accessible dynamic language state', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const runtime = html.slice(html.indexOf('<script type="module">'));

  assert.match(runtime, /const focusedTrackId = document\.activeElement\?\.dataset\.trackId;/);
  assert.match(runtime, /card\.dataset\.trackId = entry\.id;/);
  assert.match(runtime, /playButton\.dataset\.trackId = entry\.id;/);
  assert.match(runtime, /querySelector\(`\.play-button\[data-track-id="\$\{focusedTrackId\}"\]`\)\?\.focus\(\)/);
  assert.match(runtime, /description\.lang = language;/);
  assert.match(runtime, /status\.lang = language;/);
});

test('inline runtime clears an audio error only after playback starts successfully', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const runtime = html.slice(html.indexOf('<script type="module">'));

  assert.match(runtime, /audio\.play\(\)\.then\(\(\) => \{[\s\S]*?setStatus\(null\);/);
});

test('returns text in the selected language', async () => {
  assert.equal(textFor(entries[0], 'pl'), 'Polski opis podróży');
  assert.equal(textFor(entries[0], 'uk'), 'Опис українською про подорож');
});

test('searches titles, Ukrainian transcripts, and both language descriptions', () => {
  assert.deepEqual(filterEntries(entries, 'nagranie 002'), [entries[1]]);
  assert.deepEqual(filterEntries(entries, 'Києва'), [entries[0]]);
  assert.deepEqual(filterEntries(entries, 'KAWIE'), [entries[1]]);
  assert.deepEqual(filterEntries(entries, 'українською'), [entries[0]]);
});

test('formats 65 seconds as minutes and seconds', () => {
  assert.equal(formatDuration(65), '1:05');
});

test('provides localized, readable playback and loading errors', () => {
  for (const language of ['pl', 'uk']) {
    for (const key of ['loadingError', 'audioError']) {
      assert.equal(typeof statusText(language, key), 'string');
      assert.ok(statusText(language, key).trim().length > 0);
    }
  }
});

test('renders the current status key in the selected language', () => {
  assert.equal(renderStatus('pl', 'audioError'), statusText('pl', 'audioError'));
  assert.equal(renderStatus('uk', 'audioError'), statusText('uk', 'audioError'));
  assert.notEqual(renderStatus('pl', 'audioError'), renderStatus('uk', 'audioError'));
  assert.equal(renderStatus('uk', null), '');
});
