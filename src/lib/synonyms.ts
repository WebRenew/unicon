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
  ["rotate", "spin", "turn", "refresh", "cycle"],
  ["flip", "mirror", "reverse", "invert"],
  ["eye", "view", "see", "show", "visible", "preview", "watch"],
  ["hide", "invisible", "hidden", "conceal", "eye-off"],
  ["print", "printer", "output", "document", "paper"],
  
  // Media & Files
  ["file", "document", "doc", "page", "paper"],
  ["folder", "directory", "category", "collection"],
  ["image", "photo", "picture", "gallery", "media"],
  ["video", "movie", "film", "media", "play"],
  ["audio", "sound", "music", "speaker", "volume"],
  ["camera", "photo", "picture", "snapshot", "capture"],
  ["microphone", "mic", "audio", "record", "voice"],
  ["attachment", "file", "attach", "paperclip", "document"],
  ["archive", "zip", "compress", "backup", "storage"],
  ["pdf", "document", "file", "portable", "adobe"],
  ["zip", "compress", "archive", "package", "bundle"],
  
  // Communication
  ["mail", "email", "envelope", "message", "letter", "inbox"],
  ["chat", "message", "comment", "conversation", "bubble", "talk"],
  ["notification", "bell", "alert", "reminder", "notice"],
  ["share", "social", "forward", "send", "distribute"],
  ["link", "chain", "url", "connect", "attach"],
  ["send", "mail", "message", "share", "forward", "transmit"],
  ["receive", "inbox", "get", "accept", "download"],
  ["inbox", "mail", "messages", "receive", "email"],
  ["outbox", "sent", "mail", "messages", "send"],
  ["reply", "respond", "answer", "message", "feedback"],
  ["forward", "share", "send", "pass", "redirect"],
  ["attach", "attachment", "paperclip", "clip", "file"],
  ["phone", "call", "telephone", "contact", "mobile"],
  ["call", "phone", "telephone", "ring", "contact"],
  ["video", "camera", "call", "conference", "meeting"],
  
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
  ["breadcrumb", "navigation", "path", "trail", "hierarchy"],
  ["pagination", "pages", "next", "previous", "navigate"],
  ["separator", "divider", "line", "split", "divide"],
  ["divider", "separator", "line", "split", "break"],
  ["badge", "label", "tag", "indicator", "counter"],
  ["avatar", "profile", "picture", "user", "photo"],
  ["skeleton", "loading", "placeholder", "shimmer", "ghost"],
  ["spinner", "loading", "circle", "rotate", "wait"],
  ["dots", "loading", "ellipsis", "more", "menu"],
  ["bars", "menu", "hamburger", "lines", "list"],
  
  // Data & Charts
  ["chart", "graph", "analytics", "statistics", "data", "report"],
  ["bar", "chart", "graph", "histogram"],
  ["pie", "chart", "donut", "circular"],
  ["line", "chart", "trend", "graph"],
  ["table", "grid", "spreadsheet", "data", "list"],
  ["trend", "trending", "up", "chart", "growth", "increase"],
  ["trending-up", "increase", "growth", "rise", "up"],
  ["trending-down", "decrease", "decline", "fall", "down"],
  ["activity", "pulse", "heartbeat", "stats", "metrics"],
  
  // Business & Commerce
  ["cart", "shopping", "basket", "bag", "purchase", "buy"],
  ["money", "dollar", "currency", "payment", "finance", "cash"],
  ["credit", "card", "payment", "bank", "debit"],
  ["invoice", "receipt", "bill", "payment"],
  ["business", "briefcase", "work", "office", "corporate"],
  ["calendar", "date", "schedule", "event", "time"],
  ["wallet", "purse", "money", "finance", "payment"],
  ["tag", "label", "price", "badge", "mark"],
  ["sale", "discount", "offer", "deal", "promo"],
  ["product", "item", "goods", "merchandise", "package"],
  ["store", "shop", "market", "retail", "commerce"],
  ["gift", "present", "package", "surprise", "reward"],
  
  // Settings & System
  ["settings", "gear", "cog", "preferences", "config", "options", "configure"],
  ["lock", "secure", "security", "password", "protected", "private"],
  ["unlock", "open", "unsecure", "public"],
  ["key", "password", "access", "credential", "auth"],
  ["power", "on", "off", "shutdown", "start"],
  ["wifi", "wireless", "network", "internet", "signal"],
  ["bluetooth", "wireless", "connect", "pair"],
  ["battery", "power", "charge", "energy"],
  ["accessibility", "a11y", "handicap", "wheelchair", "access"],
  
  // Authentication
  ["login", "signin", "sign-in", "authenticate", "access", "enter"],
  ["logout", "signout", "sign-out", "exit", "disconnect"],
  ["register", "signup", "sign-up", "join", "create-account"],
  ["authentication", "auth", "verify", "login", "security", "2fa"],
  ["shield", "protect", "secure", "guard", "safety", "defense"],
  
  // Status & Feedback
  ["check", "done", "complete", "success", "verified", "correct", "tick"],
  ["close", "x", "cancel", "dismiss", "remove", "exit"],
  ["warning", "alert", "caution", "attention", "exclamation"],
  ["error", "danger", "problem", "issue", "fail", "wrong"],
  ["info", "information", "about", "details", "help"],
  ["question", "help", "support", "faq", "ask"],
  ["loading", "spinner", "wait", "progress", "processing"],
  ["success", "check", "done", "complete", "verified"],
  ["help", "support", "question", "faq", "info", "assist"],
  ["support", "help", "assist", "service", "aid"],
  ["thumbs-up", "like", "approve", "good", "positive"],
  ["thumbs-down", "dislike", "disapprove", "bad", "negative"],
  ["dot", "circle", "point", "indicator", "bullet"],
  ["badge", "label", "tag", "indicator", "mark"],
  ["flag", "marker", "banner", "indicator", "bookmark"],
  
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
  ["weather", "forecast", "climate", "conditions", "temperature"],
  ["wind", "breeze", "air", "weather", "blow"],
  ["lightning", "bolt", "thunder", "storm", "electric"],
  ["fire", "flame", "burn", "hot", "heat"],
  ["water", "liquid", "drop", "aqua", "h2o"],
  ["drop", "droplet", "water", "liquid", "tear"],
  
  // Devices & Hardware
  ["phone", "mobile", "smartphone", "device", "cell"],
  ["computer", "desktop", "pc", "monitor", "screen"],
  ["laptop", "notebook", "computer", "portable"],
  ["tablet", "ipad", "device", "mobile"],
  ["printer", "print", "output", "document"],
  ["keyboard", "type", "input", "keys"],
  ["mouse", "cursor", "pointer", "click"],
  ["tv", "television", "screen", "monitor", "display"],
  ["display", "screen", "monitor", "show", "view"],
  ["monitor", "screen", "display", "computer", "tv"],
  ["router", "network", "wifi", "internet", "connection"],
  ["usb", "port", "connect", "plug", "device"],
  ["hard-drive", "disk", "storage", "hdd", "drive"],
  ["cpu", "processor", "chip", "computer", "hardware"],
  ["memory", "ram", "storage", "chip", "computer"],
  
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
  ["social", "share", "network", "media", "community"],
  ["twitter", "x", "tweet", "social", "bird"],
  ["facebook", "fb", "social", "meta"],
  ["instagram", "ig", "photo", "social", "camera"],
  ["linkedin", "professional", "career", "social", "network"],
  ["youtube", "video", "play", "social", "tube"],
  ["github", "git", "code", "repository", "social"],
  ["discord", "chat", "voice", "gaming", "social"],
  ["slack", "chat", "work", "team", "communication"],
  
  // Layout & Design
  ["grid", "layout", "columns", "rows", "table"],
  ["list", "items", "rows", "lines", "bullet"],
  ["columns", "layout", "grid", "divide"],
  ["rows", "layout", "grid", "horizontal"],
  ["expand", "fullscreen", "maximize", "enlarge", "grow"],
  ["collapse", "minimize", "shrink", "compress", "reduce"],
  ["zoom", "magnify", "scale", "resize"],
  ["align-left", "left", "align", "justify-left"],
  ["align-center", "center", "align", "middle"],
  ["align-right", "right", "align", "justify-right"],
  ["align-justify", "justify", "align", "spread"],
  ["spacing", "padding", "margin", "gap", "whitespace"],
  ["border", "outline", "edge", "frame", "boundary"],
  ["crop", "cut", "trim", "resize", "edit"],
  ["resize", "scale", "size", "dimension", "adjust"],
  
  // Drawing & Creative
  ["pen", "draw", "write", "pencil", "edit"],
  ["pencil", "draw", "edit", "write", "sketch"],
  ["brush", "paint", "draw", "art", "creative"],
  ["paint", "brush", "color", "art", "draw"],
  ["draw", "sketch", "create", "art", "design"],
  ["design", "create", "art", "layout", "style"],
  ["art", "creative", "design", "paint", "draw"],
  ["eraser", "delete", "remove", "clear", "undo"],
  
  // Code & Development
  ["code", "programming", "developer", "syntax", "script"],
  ["terminal", "console", "command", "cli", "shell"],
  ["git", "version", "branch", "commit", "repository"],
  ["database", "db", "storage", "data", "sql"],
  ["api", "endpoint", "interface", "connect"],
  ["bug", "error", "issue", "debug", "problem"],
  ["server", "host", "backend", "cloud", "infrastructure"],
  ["package", "box", "bundle", "module", "library"],
  
  // Time & Clock
  ["clock", "time", "hour", "minute", "watch"],
  ["timer", "countdown", "stopwatch", "alarm"],
  ["alarm", "alert", "wake", "reminder", "notification"],
  ["hourglass", "time", "wait", "loading", "timer"],
  ["watch", "clock", "time", "wrist", "timer"],
  
  // Location & Maps
  ["map", "location", "place", "geography", "world"],
  ["location", "pin", "marker", "place", "gps", "position"],
  ["pin", "marker", "location", "place", "point"],
  ["compass", "direction", "navigate", "north", "orientation"],
  ["navigation", "gps", "map", "route", "directions"],
  ["globe", "world", "earth", "planet", "international"],
  ["flag", "banner", "country", "nation", "mark"],
  
  // Text & Typography
  ["text", "type", "font", "typography", "letter"],
  ["bold", "strong", "thick", "heavy", "emphasis"],
  ["italic", "slant", "oblique", "emphasis"],
  ["underline", "underscore", "emphasize", "highlight"],
  ["heading", "title", "header", "h1", "h2"],
  ["paragraph", "text", "body", "content", "block"],
  ["align", "alignment", "justify", "center", "left", "right"],
  ["quote", "blockquote", "citation", "text"],
  
  // Shapes & Geometry
  ["circle", "round", "dot", "ball", "sphere"],
  ["square", "box", "rectangle", "block"],
  ["triangle", "pyramid", "arrow", "shape"],
  ["rectangle", "box", "square", "block"],
  ["diamond", "rhombus", "gem", "shape"],
  ["shape", "geometry", "form", "figure"],
  ["polygon", "shape", "multi-sided", "geometry"],
  
  // Health & Medical
  ["medical", "health", "healthcare", "hospital", "doctor"],
  ["health", "medical", "wellness", "fitness", "vital"],
  ["hospital", "medical", "clinic", "emergency", "healthcare"],
  ["doctor", "physician", "medical", "healthcare", "md"],
  ["medicine", "pill", "drug", "medication", "pharmacy"],
  ["pill", "medicine", "tablet", "drug", "medication"],
  ["heart-rate", "pulse", "heartbeat", "health", "vital"],
  ["syringe", "injection", "needle", "vaccine", "medical"],
  ["bandage", "band-aid", "medical", "first-aid", "health"],
  
  // Education & Learning
  ["school", "education", "learn", "student", "academy"],
  ["education", "school", "learn", "study", "knowledge"],
  ["book", "read", "library", "literature", "text"],
  ["library", "books", "reading", "archive", "collection"],
  ["graduation", "graduate", "diploma", "degree", "cap"],
  ["student", "pupil", "learner", "scholar", "user"],
  ["teacher", "instructor", "educator", "professor", "tutor"],
  ["certificate", "diploma", "award", "credential", "badge"],
  
  // Food & Dining
  ["food", "eat", "meal", "restaurant", "dining"],
  ["restaurant", "dining", "food", "eat", "menu"],
  ["coffee", "cafe", "drink", "beverage", "cup"],
  ["cup", "mug", "drink", "coffee", "tea"],
  ["drink", "beverage", "liquid", "cup", "glass"],
  ["pizza", "food", "slice", "restaurant", "italian"],
  ["utensils", "fork", "knife", "spoon", "cutlery", "silverware"],
  ["chef", "cook", "culinary", "kitchen", "food"],
  
  // Entertainment & Gaming
  ["game", "gaming", "play", "controller", "joystick"],
  ["gaming", "game", "play", "video-game", "esports"],
  ["controller", "gamepad", "joystick", "gaming", "console"],
  ["dice", "random", "game", "chance", "roll"],
  ["trophy", "award", "win", "prize", "achievement"],
  ["medal", "award", "winner", "achievement", "trophy"],
  ["music", "audio", "sound", "song", "melody"],
  ["headphones", "audio", "music", "listen", "earphones"],
  ["speaker", "audio", "sound", "volume", "music"],
  ["volume", "audio", "sound", "speaker", "loud"],
  
  // Emotions & Faces
  ["happy", "smile", "joy", "pleased", "cheerful"],
  ["sad", "unhappy", "frown", "upset", "disappointed"],
  ["smile", "happy", "grin", "pleased", "joy"],
  ["laugh", "lol", "funny", "humor", "happy"],
  ["emoji", "emoticon", "smiley", "face", "emotion"],
  ["face", "emoji", "person", "head", "avatar"],
  
  // Tools & Utilities
  ["tool", "utility", "instrument", "implement"],
  ["wrench", "tool", "adjust", "fix", "repair"],
  ["hammer", "tool", "build", "construction", "nail"],
  ["screwdriver", "tool", "screw", "fix", "repair"],
  ["repair", "fix", "mend", "restore", "service"],
  ["build", "construct", "create", "make", "assemble"],
  
  // Validation & Status
  ["valid", "correct", "verified", "approved", "check"],
  ["invalid", "incorrect", "error", "wrong", "x"],
  ["approved", "accept", "verified", "confirmed", "check"],
  ["rejected", "declined", "denied", "refused", "x"],
  ["verified", "approved", "confirmed", "validated", "check"],
  ["pending", "waiting", "processing", "queue", "clock"],
  
  // Nature & Environment
  ["tree", "plant", "nature", "forest", "wood"],
  ["leaf", "plant", "nature", "foliage", "green"],
  ["flower", "plant", "bloom", "nature", "floral"],
  ["plant", "nature", "grow", "green", "botanical"],
  ["nature", "environment", "eco", "green", "natural"],
  ["environment", "eco", "nature", "green", "earth"],
  ["recycle", "eco", "environment", "green", "reuse"],
  
  // Sports & Fitness
  ["sports", "athletic", "fitness", "game", "activity"],
  ["ball", "sports", "game", "play", "sphere"],
  ["trophy", "award", "win", "prize", "achievement"],
  ["medal", "award", "winner", "achievement", "trophy"],
  ["award", "trophy", "prize", "medal", "achievement"],
  ["fitness", "health", "exercise", "workout", "gym"],
  ["dumbbell", "weight", "fitness", "gym", "exercise"],
  
  // Dashboard & Analytics
  ["dashboard", "panel", "overview", "summary", "analytics"],
  ["analytics", "stats", "metrics", "data", "insights"],
  ["metrics", "stats", "kpi", "data", "analytics"],
  ["report", "document", "analytics", "summary", "data"],
  ["insights", "analytics", "data", "intelligence", "stats"],
  
  // Finance & Money
  ["wallet", "purse", "money", "finance", "payment"],
  ["coin", "money", "currency", "finance", "cash"],
  ["dollar", "usd", "money", "currency", "finance"],
  ["euro", "eur", "money", "currency", "finance"],
  ["pound", "gbp", "money", "currency", "finance"],
  ["yen", "jpy", "money", "currency", "finance"],
  ["bank", "finance", "money", "institution", "banking"],
  ["piggy-bank", "savings", "money", "finance", "save"],
  
  // Buildings & Places
  ["building", "structure", "architecture", "property"],
  ["hospital", "medical", "clinic", "emergency", "healthcare"],
  ["school", "education", "learn", "student", "academy"],
  ["library", "books", "reading", "archive", "collection"],
  ["store", "shop", "market", "retail", "commerce"],
  ["factory", "industry", "manufacturing", "plant", "production"],
  ["warehouse", "storage", "depot", "stock", "inventory"],
  
  // Documents & Text Editing
  ["document", "file", "paper", "doc", "text"],
  ["documents", "files", "papers", "docs", "text"],
  ["page", "document", "sheet", "paper", "file"],
  ["note", "memo", "text", "document", "write"],
  ["clipboard", "copy", "paste", "buffer", "notes"],
  
  // Celebration & Events
  ["party", "celebrate", "celebration", "fun", "event"],
  ["celebrate", "party", "celebration", "cheers", "happy"],
  ["celebration", "party", "event", "festive", "happy"],
  ["cake", "birthday", "dessert", "celebration", "sweet"],
  ["balloon", "party", "celebrate", "float", "air"],
  ["confetti", "celebrate", "party", "festive", "fun"],
  
  // Security & Privacy
  ["security", "lock", "shield", "protect", "safe"],
  ["privacy", "private", "hidden", "secure", "confidential"],
  ["password", "key", "secret", "credentials", "passcode"],
  ["fingerprint", "biometric", "security", "auth", "touch"],
  ["scan", "qr", "barcode", "read", "check"],
  ["qr", "qr-code", "scan", "barcode", "code"],
  ["barcode", "scan", "code", "product", "sku"],
  
  // Connection & Network
  ["connection", "connect", "link", "network", "online"],
  ["connected", "online", "link", "active", "live"],
  ["disconnected", "offline", "unlink", "inactive", "down"],
  ["online", "connected", "live", "active", "internet"],
  ["offline", "disconnected", "unavailable", "down", "local"],
  ["signal", "wifi", "connection", "network", "strength"],
  ["antenna", "signal", "wireless", "broadcast", "tower"],
  
  // Sorting & Organization
  ["sort", "order", "arrange", "organize", "filter"],
  ["ascending", "up", "sort", "increase", "a-z"],
  ["descending", "down", "sort", "decrease", "z-a"],
  ["alphabetical", "sort", "a-z", "order", "abc"],
  
  // Arrows (Extended)
  ["diagonal", "arrow", "corner", "angle", "slant"],
  ["corner", "angle", "turn", "bend", "edge"],
  ["double", "arrows", "multiple", "extra", "more"],
  ["curved", "arc", "bend", "round", "arrow"],
  
  // Multimedia
  ["skip", "next", "forward", "jump", "advance"],
  ["rewind", "back", "previous", "reverse"],
  ["record", "capture", "save", "video", "audio"],
  ["live", "streaming", "broadcast", "online", "real-time"],
  ["broadcast", "stream", "live", "transmit", "air"],
  ["mute", "silent", "quiet", "volume", "sound-off"],
  ["unmute", "sound", "volume", "audio", "sound-on"],
  
  // Selection & Input
  ["select", "choose", "pick", "option", "checkbox"],
  ["deselect", "uncheck", "remove", "clear", "unselect"],
  ["selected", "checked", "chosen", "active", "picked"],
  ["input", "field", "form", "enter", "type"],
  ["form", "input", "fields", "submit", "data"],
  ["submit", "send", "post", "save", "confirm"],
  
  // Zoom & View
  ["zoom-in", "magnify", "enlarge", "expand", "plus"],
  ["zoom-out", "minimize", "shrink", "reduce", "minus"],
  ["fit", "scale", "resize", "adjust", "fullscreen"],
  ["exit-fullscreen", "minimize", "restore", "shrink"],
  
  // Language & Internationalization
  ["language", "translate", "locale", "i18n", "international"],
  ["translate", "language", "convert", "localize", "i18n"],
  
  // Speed & Performance
  ["fast", "speed", "quick", "rapid", "swift"],
  ["slow", "speed", "lag", "delay", "wait"],
  ["speed", "fast", "velocity", "performance", "quick"],
  ["rocket", "fast", "launch", "speed", "boost"],
  ["zap", "lightning", "fast", "bolt", "electric"],
  
  // Temperature & Climate
  ["hot", "heat", "warm", "fire", "temperature"],
  ["cold", "cool", "freeze", "ice", "temperature"],
  ["temperature", "temp", "heat", "climate", "weather"],
  ["thermometer", "temperature", "temp", "heat", "gauge"],
  
  // Movement & Animation
  ["move", "drag", "shift", "relocate", "transport"],
  ["drag", "move", "pull", "handle", "grab"],
  ["shake", "vibrate", "wiggle", "tremble", "motion"],
  ["bounce", "spring", "jump", "elastic", "rebound"],
  
  // Quality & Rating
  ["quality", "grade", "rating", "standard", "level"],
  ["rating", "stars", "review", "score", "rank"],
  ["rank", "rating", "order", "position", "level"],
  ["level", "tier", "grade", "rank", "stage"],
  
  // Direction & Orientation
  ["vertical", "up-down", "portrait", "y-axis"],
  ["horizontal", "left-right", "landscape", "x-axis"],
  
  // Brightness & Contrast
  ["brightness", "light", "luminance", "glow", "shine"],
  ["contrast", "difference", "compare", "adjust"],
  ["opacity", "transparency", "alpha", "visibility", "fade"],
  
  // Miscellaneous Common Searches
  ["more", "ellipsis", "dots", "menu", "options"],
  ["less", "collapse", "hide", "minimize", "fewer"],
  ["external", "link", "outside", "new-window", "open"],
  ["internal", "link", "inside", "same-window"],
  ["anchor", "link", "hyperlink", "url", "reference"],
  ["target", "aim", "goal", "bullseye", "focus"],
  ["focus", "target", "aim", "center", "attention"],
  ["qrcode", "qr", "scan", "code", "matrix"],
  ["flash", "lightning", "bolt", "quick", "instant"],
  ["crown", "king", "queen", "royal", "premium"],
  ["gem", "diamond", "jewel", "premium", "valuable"],
  ["sparkle", "shine", "glitter", "star", "twinkle"],
  ["magic", "wand", "sparkle", "wizard", "enchant"],
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

