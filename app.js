export function textFor(entry, language) {
  return language === 'uk' ? entry.descriptionUk : entry.descriptionPl;
}

export function formatDuration(seconds) {
  const wholeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}

export function filterEntries(entries, query) {
  const needle = String(query ?? '').trim().toLocaleLowerCase();
  if (!needle) return entries;

  return entries.filter((entry) =>
    [entry.title, entry.transcriptUk, entry.descriptionUk, entry.descriptionPl]
      .filter((value) => value != null)
      .some((value) => String(value).toLocaleLowerCase().includes(needle)),
  );
}

export function groupForEntry(entry) {
  const match = String(entry.transcriptUk ?? '').match(/(?:номер|№)[^LMOPЛМОП]*([LMOPЛМОП])/iu);
  const letter = match?.[1].toUpperCase();
  return ({ Л: 'L', М: 'M', О: 'O', П: 'P' })[letter] || letter || 'Pozostałe';
}

const copy = {
  pl: {
    search: 'Szukaj w nagraniach',
    count: (count) => `Widoczne nagrania: ${count}`,
    play: 'Odtwórz', stop: 'Zatrzymaj', duration: 'Czas trwania', loading: 'Wczytywanie katalogu…',
    loadingError: 'Nie udało się wczytać katalogu nagrań. Spróbuj ponownie później.',
    audioError: 'Nie udało się odtworzyć tego nagrania.',
    empty: 'Nie znaleziono nagrań spełniających kryteria wyszukiwania.',
  },
  uk: {
    search: 'Пошук у записах',
    count: (count) => `Видимі записи: ${count}`,
    play: 'Відтворити', stop: 'Зупинити', duration: 'Тривалість', loading: 'Завантаження каталогу…',
    loadingError: 'Не вдалося завантажити каталог записів. Спробуйте пізніше.',
    audioError: 'Не вдалося відтворити цей запис.',
    empty: 'Записів за вашим запитом не знайдено.',
  },
};

export function statusText(language, key) {
  return copy[language === 'uk' ? 'uk' : 'pl'][key] || '';
}

export function renderStatus(language, key) {
  return key ? statusText(language, key) : '';
}

function initializeCatalog() {
  const languageToggle = document.querySelector('#language-toggle');
  const search = document.querySelector('#search');
  const count = document.querySelector('#track-count');
  const catalog = document.querySelector('#catalog');
  const status = document.querySelector('#status');
  if (!languageToggle || !search || !count || !catalog || !status) return;

  let language = 'pl';
  let entries = [];
  let activeEntryId = null;
  let activeAudio = null;
  let statusKey = null;
  const setStatus = (key) => {
    statusKey = key;
    status.textContent = renderStatus(language, statusKey);
  };
  const stopActiveAudio = () => {
    if (!activeAudio) return;
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
    activeEntryId = null;
  };

  const render = () => {
    const focusedTrackId = document.activeElement?.dataset.trackId;
    const visibleEntries = filterEntries(entries, search.value);
    languageToggle.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    search.setAttribute('aria-label', statusText(language, 'search'));
    search.placeholder = statusText(language, 'search');
    search.lang = language;
    count.textContent = statusText(language, 'count')(visibleEntries.length);
    count.lang = language;
    status.textContent = renderStatus(language, statusKey);
    status.lang = language;
    catalog.replaceChildren();
    if (!visibleEntries.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = statusText(language, 'empty');
      empty.lang = language;
      catalog.append(empty);
      return;
    }
    ['Pozostałe', 'L', 'M', 'O', 'P'].forEach((group) => {
      const groupEntries = visibleEntries.filter((entry) => groupForEntry(entry) === group);
      if (!groupEntries.length) return;
      const section = document.createElement('section');
      section.className = 'catalog-group';
      section.setAttribute('aria-labelledby', `group-${group}`);
      const heading = document.createElement('h2');
      heading.className = 'group-title';
      heading.id = `group-${group}`;
      heading.textContent = group;
      const groupTracks = document.createElement('div');
      groupTracks.className = 'group-tracks';
      groupEntries.forEach((entry, index) => {
      const card = document.createElement('article');
      const isPlaying = entry.id === activeEntryId;
      card.className = `track-card${isPlaying ? ' is-playing' : ''}`;
      card.dataset.trackId = entry.id;
      const title = document.createElement('h2');
      title.textContent = `${String(entry.id || index + 1).replace('track-', '')}. ${entry.title}`;
      const meta = document.createElement('p');
      meta.className = 'track-meta';
      meta.textContent = `${statusText(language, 'duration')}: ${formatDuration(entry.durationSeconds)}`;
      meta.lang = language;
      const description = document.createElement('p');
      description.textContent = textFor(entry, language);
      description.lang = language;
      const playButton = document.createElement('button');
      playButton.className = 'play-button';
      playButton.type = 'button';
      playButton.dataset.trackId = entry.id;
      playButton.setAttribute('aria-pressed', String(isPlaying));
      playButton.textContent = isPlaying ? statusText(language, 'stop') : statusText(language, 'play');
      playButton.lang = language;
      playButton.addEventListener('click', () => togglePlayback(entry));
      card.append(title, meta, description, playButton);
        groupTracks.append(card);
      });
      section.append(heading, groupTracks);
      catalog.append(section);
    });
    if (focusedTrackId) {
      catalog.querySelector(`.play-button[data-track-id="${focusedTrackId}"]`)?.focus();
    }
  };

  const togglePlayback = (entry) => {
    if (entry.id === activeEntryId) {
      stopActiveAudio();
      render();
      return;
    }
    stopActiveAudio();
    const audio = new Audio(encodeURI(entry.file));
    activeAudio = audio;
    activeEntryId = entry.id;
    audio.addEventListener('ended', () => {
      if (audio === activeAudio) { activeAudio = null; activeEntryId = null; render(); }
    });
    audio.addEventListener('error', () => {
      if (audio === activeAudio) { activeAudio = null; activeEntryId = null; setStatus('audioError'); render(); }
    });
    audio.play().then(() => {
      if (audio === activeAudio) { setStatus(null); render(); }
    }).catch(() => {
      if (audio === activeAudio) { activeAudio = null; activeEntryId = null; setStatus('audioError'); render(); }
    });
    render();
  };

  languageToggle.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-language]');
    if (!button) return;
    language = button.dataset.language === 'uk' ? 'uk' : 'pl';
    render();
  });
  search.addEventListener('input', render);
  const manifest = globalThis.AUDIO_MANIFEST;
  if (!Array.isArray(manifest)) {
    setStatus('loadingError');
    render();
    return;
  }
  entries = manifest;
  render();
}

if (typeof document !== 'undefined') initializeCatalog();
