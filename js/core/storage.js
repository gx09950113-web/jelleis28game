const STORAGE_PREFIX = "28game_";

export function getStorage(key) {
  const raw =
    localStorage.getItem(
      STORAGE_PREFIX + key
    );

  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function setStorage(
  key,
  value
) {
  localStorage.setItem(
    STORAGE_PREFIX + key,
    JSON.stringify(value)
  );
}

export function removeStorage(key) {
  localStorage.removeItem(
    STORAGE_PREFIX + key
  );
}

export function clearGameStorage() {
  const keys = [];

  for (
    let i = 0;
    i < localStorage.length;
    i++
  ) {
    const key =
      localStorage.key(i);

    if (
      key &&
      key.startsWith(
        STORAGE_PREFIX
      )
    ) {
      keys.push(key);
    }
  }

  for (
    const key
    of keys
  ) {
    localStorage.removeItem(key);
  }
}
