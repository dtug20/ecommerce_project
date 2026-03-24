export const setLocalStorage = (name, items) => {
  try {
    localStorage.setItem(name, JSON.stringify(items));
  } catch (err) {
    // Safari Private Browsing or quota exceeded — silently fail
  }
};

export const getLocalStorage = (name) => {
  try {
    const data = localStorage.getItem(name);
    if (data) {
      return JSON.parse(data);
    } else {
      localStorage.setItem(name, JSON.stringify([]));
      return [];
    }
  } catch (err) {
    // Safari Private Browsing or corrupted data — return empty
    return [];
  }
};
