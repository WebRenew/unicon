/**
 * Pre-computed synonym mappings for icon search.
 * 
 * This enables instant query expansion without API calls.
 * Each key maps to an array of related terms that should also be searched.
 */

/** Bidirectional synonym map for icon-related terms */
const SYNONYM_GROUPS: readonly string[][] = [
  // Navigation & Arrows
  ["arrow", "chevron", "caret", "pointer", "direction", "navigate"],
  ["left", "back", "previous", "west"],
  ["right", "forward", "next", "east"],
  ["up", "above", "north", "top"],
  ["down", "below", "south", "bottom"],
  ["home", "house", "residence", "building", "property", "dwelling"],
  ["menu", "hamburger", "navigation", "nav", "sidebar"],
  
  // People & Users
  ["user", "person", "account", "profile", "member", "avatar", "people"],
  ["users", "people", "group", "team", "members", "community"],
  ["contact", "person", "address", "phone", "call"],
  
  // Actions
  ["add", "plus", "create", "new", "insert"],
  ["remove", "delete", "trash", "bin", "garbage", "erase", "clear"],
  ["edit", "pencil", "pen", "write", "modify", "change", "update"],
  ["save", "disk", "floppy", "store", "persist"],
  ["search", "find", "lookup", "magnifier", "magnifying", "explore", "query"],
  ["filter", "funnel", "sort", "refine"],
  ["refresh", "reload", "sync", "update", "rotate"],
  ["download", "save", "export", "get"],
  ["upload", "import", "send", "put"],
  ["copy", "duplicate", "clone", "clipboard"],
  ["paste", "clipboard", "insert"],
  ["cut", "scissors", "trim"],
  ["undo", "back", "revert", "previous"],
  ["redo", "forward", "repeat"],
  ["play", "start", "begin", "run"],
  ["pause", "stop", "halt", "wait"],
  ["stop", "halt", "end", "terminate"],
  
  // Media & Files
  ["file", "document", "doc", "page", "paper"],
  ["folder", "directory", "category", "collection"],
  ["image", "photo", "picture", "gallery", "media"],
  ["video", "movie", "film", "media", "play"],
  ["audio", "sound", "music", "speaker", "volume"],
  ["camera", "photo", "picture", "snapshot", "capture"],
  ["microphone", "mic", "audio", "record", "voice"],
  
  // Communication
  ["mail", "email", "envelope", "message", "letter", "inbox"],
  ["chat", "message", "comment", "conversation", "bubble", "talk"],
  ["notification", "bell", "alert", "reminder", "notice"],
  ["share", "social", "forward", "send", "distribute"],
  ["link", "chain", "url", "connect", "attach"],
  
  // UI Elements
  ["button", "btn", "action", "click"],
  ["checkbox", "check", "tick", "done", "complete"],
  ["radio", "option", "select", "choice"],
  ["toggle", "switch", "on", "off"],
  ["slider", "range", "adjust"],
  ["dropdown", "select", "menu", "list", "options"],
  ["modal", "dialog", "popup", "overlay", "window"],
  ["tab", "tabs", "panel", "section"],
  ["tooltip", "hint", "help", "info"],
  
  // Data & Charts
  ["chart", "graph", "analytics", "statistics", "data", "report"],
  ["bar", "chart", "graph", "histogram"],
  ["pie", "chart", "donut", "circular"],
  ["line", "chart", "trend", "graph"],
  ["table", "grid", "spreadsheet", "data", "list"],
  
  // Business & Commerce
  ["cart", "shopping", "basket", "bag", "purchase", "buy"],
  ["money", "dollar", "currency", "payment", "finance", "cash"],
  ["credit", "card", "payment", "bank", "debit"],
  ["invoice", "receipt", "bill", "payment"],
  ["business", "briefcase", "work", "office", "corporate"],
  ["calendar", "date", "schedule", "event", "time"],
  
  // Settings & System
  ["settings", "gear", "cog", "preferences", "config", "options", "configure"],
  ["lock", "secure", "security", "password", "protected", "private"],
  ["unlock", "open", "unsecure", "public"],
  ["key", "password", "access", "credential", "auth"],
  ["power", "on", "off", "shutdown", "start"],
  ["wifi", "wireless", "network", "internet", "signal"],
  ["bluetooth", "wireless", "connect", "pair"],
  ["battery", "power", "charge", "energy"],
  
  // Status & Feedback
  ["check", "done", "complete", "success", "verified", "correct", "tick"],
  ["close", "x", "cancel", "dismiss", "remove", "exit"],
  ["warning", "alert", "caution", "attention", "exclamation"],
  ["error", "danger", "problem", "issue", "fail", "wrong"],
  ["info", "information", "about", "details", "help"],
  ["question", "help", "support", "faq", "ask"],
  ["loading", "spinner", "wait", "progress", "processing"],
  
  // Theme & Appearance
  ["theme", "appearance", "style", "mode", "color-scheme", "dark-mode", "light-mode"],
  ["dark", "night", "moon", "dark-mode", "theme", "black"],
  ["light", "day", "sun", "light-mode", "theme", "bright", "white"],
  ["palette", "color", "colors", "theme", "paint", "swatch"],
  
  // Weather & Nature
  ["sun", "light", "day", "bright", "sunny"],
  ["moon", "night", "dark", "evening"],
  ["cloud", "weather", "sky", "storage"],
  ["rain", "weather", "water", "drop"],
  ["snow", "winter", "cold", "weather"],
  ["star", "favorite", "bookmark", "rating", "featured"],
  ["heart", "love", "like", "favorite", "health"],
  
  // Devices & Hardware
  ["phone", "mobile", "smartphone", "device", "cell"],
  ["computer", "desktop", "pc", "monitor", "screen"],
  ["laptop", "notebook", "computer", "portable"],
  ["tablet", "ipad", "device", "mobile"],
  ["printer", "print", "output", "document"],
  ["keyboard", "type", "input", "keys"],
  ["mouse", "cursor", "pointer", "click"],
  
  // Transportation
  ["car", "auto", "vehicle", "automotive", "drive", "transport"],
  ["truck", "delivery", "shipping", "transport", "lorry"],
  ["plane", "airplane", "flight", "travel", "aircraft"],
  ["train", "rail", "transit", "transport"],
  ["bus", "transit", "transport", "public"],
  ["bike", "bicycle", "cycle", "transport"],
  ["ship", "boat", "vessel", "marine", "sea"],
  
  // Social & Branding
  ["like", "thumbs", "approve", "upvote", "positive"],
  ["dislike", "thumbs", "disapprove", "downvote", "negative"],
  ["follow", "subscribe", "add", "connect"],
  ["bookmark", "save", "favorite", "star", "mark"],
  
  // Layout & Design
  ["grid", "layout", "columns", "rows", "table"],
  ["list", "items", "rows", "lines", "bullet"],
  ["columns", "layout", "grid", "divide"],
  ["rows", "layout", "grid", "horizontal"],
  ["expand", "fullscreen", "maximize", "enlarge", "grow"],
  ["collapse", "minimize", "shrink", "compress", "reduce"],
  ["zoom", "magnify", "scale", "resize"],
  
  // Code & Development
  ["code", "programming", "developer", "syntax", "script"],
  ["terminal", "console", "command", "cli", "shell"],
  ["git", "version", "branch", "commit", "repository"],
  ["database", "db", "storage", "data", "sql"],
  ["api", "endpoint", "interface", "connect"],
  ["bug", "error", "issue", "debug", "problem"],
] as const;

/** 
 * Build a lookup map from any term to all its related terms.
 * This is computed once at module load time.
 */
function buildSynonymMap(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  
  for (const group of SYNONYM_GROUPS) {
    // For each term in the group, map it to all other terms
    for (const term of group) {
      const existing = map.get(term) ?? new Set<string>();
      for (const related of group) {
        if (related !== term) {
          existing.add(related);
        }
      }
      map.set(term, existing);
    }
  }
  
  return map;
}

const synonymMap = buildSynonymMap();

/**
 * Get related terms for a given word.
 * Returns empty array if no synonyms found.
 */
export function getSynonyms(term: string): string[] {
  const normalized = term.toLowerCase().trim();
  const synonyms = synonymMap.get(normalized);
  return synonyms ? Array.from(synonyms) : [];
}

/**
 * Expand a search query by adding synonyms for each word.
 * 
 * @param query - The user's search query
 * @returns Expanded query with original terms and synonyms
 * 
 * @example
 * expandQueryWithSynonyms("car icon")
 * // Returns: "car auto vehicle automotive drive transport icon"
 */
export function expandQueryWithSynonyms(query: string): string {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const expanded = new Set<string>(tokens);
  
  for (const token of tokens) {
    const synonyms = getSynonyms(token);
    for (const synonym of synonyms) {
      expanded.add(synonym);
    }
  }
  
  return Array.from(expanded).join(" ");
}

/**
 * Check if a query would benefit from synonym expansion.
 * Returns true if any token has known synonyms.
 */
export function hasSynonyms(query: string): boolean {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return tokens.some((token) => synonymMap.has(token));
}

/**
 * Get the synonym map for debugging/inspection.
 */
export function getSynonymMap(): ReadonlyMap<string, ReadonlySet<string>> {
  return synonymMap;
}

/**
 * Get statistics about the synonym database.
 */
export function getSynonymStats(): { totalTerms: number; totalGroups: number } {
  return {
    totalTerms: synonymMap.size,
    totalGroups: SYNONYM_GROUPS.length,
  };
}
