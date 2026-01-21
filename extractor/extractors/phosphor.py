import json
from pathlib import Path
from .base import BaseExtractor, ExtractedIcon


class PhosphorExtractor(BaseExtractor):
    """Extract icons from @phosphor-icons/core package."""

    # Phosphor weight variants
    WEIGHTS = ["regular", "bold", "fill", "duotone", "light", "thin"]
    PRIMARY_WEIGHT = "regular"  # Base icon weight

    def __init__(self, node_modules: Path):
        self.core_dir = node_modules / "@phosphor-icons" / "core" / "assets"
        self.package_json = node_modules / "@phosphor-icons" / "core" / "package.json"
        super().__init__(self.core_dir)

    def get_version(self) -> str:
        """Get Phosphor version from package.json."""
        try:
            with open(self.package_json) as f:
                pkg = json.load(f)
                return pkg.get("version", "unknown")
        except Exception:
            return "unknown"

    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all Phosphor icons (all weights).

        Uses two-pass approach to prevent orphaned variants:
        1. First extract all base (regular) icons
        2. Then extract variants only for icons that have a base
        """
        icons = []
        base_icon_names = set()

        if not self.core_dir.exists():
            raise FileNotFoundError(f"Phosphor icons directory not found: {self.core_dir}")

        # First pass: Extract base (regular) icons
        regular_dir = self.core_dir / self.PRIMARY_WEIGHT
        if regular_dir.exists():
            svg_files = list(regular_dir.glob("*.svg"))
            print(f"Found {len(svg_files)} Phosphor icons ({self.PRIMARY_WEIGHT})")

            for svg_file in svg_files:
                try:
                    icon = self.extract_one(svg_file, self.PRIMARY_WEIGHT)
                    icons.append(icon)
                    base_icon_names.add(icon.normalized_name)
                except Exception as e:
                    print(f"Error extracting {svg_file.name}: {e}")

        # Second pass: Extract variant icons (non-regular weights)
        for weight_dir in self.core_dir.iterdir():
            if not weight_dir.is_dir():
                continue

            weight = weight_dir.name
            if weight not in self.WEIGHTS or weight == self.PRIMARY_WEIGHT:
                continue

            svg_files = list(weight_dir.glob("*.svg"))
            print(f"Found {len(svg_files)} Phosphor icons ({weight})")

            for svg_file in svg_files:
                try:
                    icon = self.extract_one(svg_file, weight)

                    # Only add variant if base icon exists
                    if icon.normalized_name in base_icon_names:
                        icons.append(icon)
                    else:
                        print(f"  Warning: Skipping {weight} variant of '{icon.normalized_name}' (no base icon)")
                except Exception as e:
                    print(f"Error extracting {svg_file.name}: {e}")

        return icons

    def extract_one(self, path: Path, weight: str) -> ExtractedIcon:
        """Extract a single Phosphor icon."""
        content = path.read_text()
        soup = self.parse_svg(content)
        svg = soup.find("svg")

        if not svg:
            raise ValueError(f"No SVG element found in {path}")

        # Phosphor filenames include weight: "arrow-right-bold.svg"
        raw_name = path.stem
        if weight != "regular":
            raw_name = raw_name.replace(f"-{weight}", "")

        normalized_name = raw_name
        pascal_name = self.to_pascal(normalized_name)

        # All Phosphor icons are fill-based (use filled paths, not strokes)
        # This includes all weights: regular, bold, light, thin, fill, duotone

        return ExtractedIcon(
            source="phosphor",
            name=pascal_name,
            normalized_name=normalized_name,
            view_box=svg.get("viewBox", "0 0 256 256"),
            content=self.inner_content(svg),
            path_data=self.extract_paths(svg),
            default_stroke=False,
            default_fill=True,
            stroke_width=None,  # Phosphor doesn't use stroke-width
            category=weight if weight != "regular" else self._guess_category(normalized_name),
            tags=self._generate_tags(normalized_name),
            variant=weight if weight != self.PRIMARY_WEIGHT else None,
        )

    def _guess_category(self, name: str) -> str | None:
        """Guess category based on icon name patterns."""
        categories = {
            "arrows": ["arrow", "caret", "caret-circle", "caret-double"],
            "media": ["play", "pause", "stop", "speaker", "microphone", "video", "music", "camera"],
            "files": ["file", "folder", "clipboard", "notebook"],
            "communication": ["envelope", "chat", "phone", "paper-plane"],
            "weather": ["sun", "moon", "cloud", "drop", "wind", "thermometer"],
            "devices": ["desktop", "laptop", "device-tablet", "device-mobile", "printer", "keyboard"],
            "social": ["share", "heart", "thumbs-up", "star", "bookmark"],
            "navigation": ["house", "list", "magnifying-glass", "funnel", "squares-four"],
            "editing": ["pencil", "pen", "scissors", "crop", "selection"],
            "shapes": ["circle", "square", "triangle", "hexagon", "octagon"],
        }

        name_lower = name.lower()
        for category, keywords in categories.items():
            if any(kw in name_lower for kw in keywords):
                return category

        return "general"

    def _generate_tags(self, name: str) -> list[str]:
        """Generate tags from icon name."""
        words = name.split("-")
        tags = list(words)

        synonyms = {
            "arrow": ["direction", "pointer", "navigation"],
            "house": ["home", "main", "start"],
            "magnifying-glass": ["search", "find", "lookup"],
            "user": ["person", "account", "profile"],
            "gear": ["settings", "config", "preferences", "options"],
            "envelope": ["mail", "email", "message"],
            "heart": ["love", "favorite", "like"],
            "star": ["favorite", "rating", "bookmark"],
            "check": ["done", "complete", "success", "tick"],
            "x": ["close", "remove", "delete", "cancel"],
            "plus": ["add", "new", "create"],
            "minus": ["remove", "subtract", "less"],
        }

        for word in words:
            if word in synonyms:
                tags.extend(synonyms[word])

        return list(set(tags))
