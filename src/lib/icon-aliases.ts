/**
 * Icon alias mappings for improved search.
 * Maps common terms to actual icon names.
 */

// Bidirectional aliases: search for either term, find icons with either name
export const ICON_ALIASES: Record<string, string[]> = {
  // Common misspellings and alternatives
  checkmark: ["check", "check-circle", "circle-check"],
  tick: ["check", "check-circle"],
  cross: ["x", "x-circle", "close"],
  close: ["x", "x-circle"],
  cancel: ["x", "x-circle", "ban"],

  // UI element aliases
  hamburger: ["menu", "menu-square"],
  burger: ["menu"],
  cog: ["settings", "gear", "settings-2"],
  gear: ["settings", "cog", "settings-2"],
  cogwheel: ["settings", "gear"],
  preferences: ["settings", "sliders"],
  config: ["settings", "sliders"],

  // Arrow aliases
  back: ["arrow-left", "chevron-left"],
  forward: ["arrow-right", "chevron-right"],
  next: ["arrow-right", "chevron-right"],
  previous: ["arrow-left", "chevron-left"],
  up: ["arrow-up", "chevron-up"],
  down: ["arrow-down", "chevron-down"],

  // Action aliases
  remove: ["trash", "trash-2", "x", "minus"],
  delete: ["trash", "trash-2"],
  bin: ["trash", "trash-2"],
  add: ["plus", "plus-circle"],
  create: ["plus", "plus-circle"],
  new: ["plus", "plus-circle", "file-plus"],

  // User aliases
  person: ["user", "user-circle", "contact"],
  profile: ["user", "user-circle", "contact"],
  account: ["user", "user-circle"],
  avatar: ["user", "user-circle", "circle-user"],
  people: ["users", "users-2"],
  team: ["users", "users-2"],
  group: ["users", "users-2"],

  // Communication aliases
  email: ["mail", "inbox", "at-sign"],
  message: ["mail", "message-circle", "message-square"],
  chat: ["message-circle", "message-square", "messages-square"],
  comment: ["message-circle", "message-square"],

  // Media aliases
  photo: ["image", "camera", "picture"],
  picture: ["image", "camera", "photo"],
  movie: ["video", "film", "clapperboard"],
  audio: ["music", "headphones", "speaker", "volume-2"],
  sound: ["volume", "volume-2", "speaker"],

  // File aliases
  document: ["file", "file-text", "file-type"],
  doc: ["file", "file-text"],
  directory: ["folder", "folder-open"],

  // Shopping aliases
  cart: ["shopping-cart", "shopping-bag"],
  basket: ["shopping-cart", "shopping-bag"],
  bag: ["shopping-bag", "shopping-cart"],
  buy: ["shopping-cart", "credit-card"],
  purchase: ["shopping-cart", "credit-card"],

  // Status aliases
  warning: ["alert-triangle", "alert-circle", "triangle-alert"],
  error: ["alert-circle", "x-circle", "circle-x"],
  success: ["check-circle", "circle-check", "check"],
  info: ["info", "help-circle", "circle-help"],
  question: ["help-circle", "circle-help"],

  // Time aliases
  time: ["clock", "timer", "watch"],
  schedule: ["calendar", "clock", "calendar-clock"],
  date: ["calendar", "calendar-days"],

  // Location aliases
  location: ["map-pin", "navigation", "locate", "pin"],
  place: ["map-pin", "map", "pin"],
  address: ["map-pin", "home", "building"],

  // Security aliases
  password: ["lock", "key", "eye-off"],
  secure: ["lock", "shield", "shield-check"],
  protected: ["lock", "shield"],

  // Social aliases
  like: ["heart", "thumbs-up"],
  love: ["heart"],
  favorite: ["heart", "star", "bookmark"],
  share: ["share", "share-2", "send"],

  // Device aliases
  phone: ["smartphone", "phone", "mobile"],
  mobile: ["smartphone", "phone"],
  computer: ["monitor", "laptop", "desktop"],
  desktop: ["monitor", "laptop"],

  // Loading aliases
  loading: ["loader", "loader-2", "refresh-cw"],
  spinner: ["loader", "loader-2"],
  refresh: ["refresh-cw", "refresh-ccw", "rotate-cw"],
  reload: ["refresh-cw", "refresh-ccw"],

  // Visibility aliases
  show: ["eye", "eye-open"],
  hide: ["eye-off", "eye-closed"],
  visible: ["eye"],
  invisible: ["eye-off"],

  // Power aliases
  logout: ["log-out", "door-open", "exit"],
  signout: ["log-out"],
  login: ["log-in", "door-closed"],
  signin: ["log-in"],
  exit: ["log-out", "door-open"],
};

/**
 * Expand a search query with aliases.
 * Returns array of terms to search for.
 * Uses exact matching only to avoid over-expansion (e.g., "checkbox" won't expand to all "check" aliases).
 */
export function expandSearchQuery(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  const terms = new Set<string>([normalizedQuery]);

  // Check if query matches any alias key (e.g., "checkmark" -> ["check", "check-circle"])
  if (ICON_ALIASES[normalizedQuery]) {
    ICON_ALIASES[normalizedQuery].forEach((alias) => terms.add(alias));
  }

  // Reverse lookup: if query matches an alias value exactly, add the key and siblings
  // (e.g., "check-circle" -> also search for "checkmark", "tick", "check")
  for (const [key, values] of Object.entries(ICON_ALIASES)) {
    if (values.includes(normalizedQuery)) {
      terms.add(key);
      values.forEach((v) => terms.add(v));
    }
  }

  return Array.from(terms);
}
