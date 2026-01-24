import json
from pathlib import Path
from .base import BaseExtractor, ExtractedIcon


class IconoirExtractor(BaseExtractor):
    """Extract icons from iconoir package."""

    def __init__(self, node_modules: Path):
        # Iconoir has icons/regular and icons/solid subdirectories
        self.icons_dir = node_modules / "iconoir" / "icons"
        self.package_json = node_modules / "iconoir" / "package.json"
        super().__init__(self.icons_dir)

    def get_version(self) -> str:
        """Get Iconoir version from package.json."""
        try:
            with open(self.package_json) as f:
                pkg = json.load(f)
                return pkg.get("version", "unknown")
        except Exception:
            return "unknown"

    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all Iconoir icons."""
        icons = []

        if not self.icons_dir.exists():
            raise FileNotFoundError(f"Iconoir icons directory not found: {self.icons_dir}")

        # Extract both regular and solid variants
        for style in ["regular", "solid"]:
            style_dir = self.icons_dir / style
            if not style_dir.exists():
                print(f"Warning: {style} directory not found")
                continue

            svg_files = list(style_dir.glob("*.svg"))
            print(f"Found {len(svg_files)} Iconoir {style} icons")

            for svg_file in svg_files:
                try:
                    icon = self.extract_one(svg_file, style)
                    icons.append(icon)
                except Exception as e:
                    print(f"Error extracting {svg_file.name}: {e}")

        return icons

    def extract_one(self, path: Path, style: str) -> ExtractedIcon:
        """Extract a single Iconoir icon."""
        content = path.read_text()
        soup = self.parse_svg(content)
        svg = soup.find("svg")

        if not svg:
            raise ValueError(f"No SVG element found in {path}")

        # Iconoir uses kebab-case filenames
        # Add style suffix to normalized name to make regular/solid unique icons
        base_name = path.stem
        normalized_name = f"{base_name}-{style}"
        pascal_name = self.to_pascal(normalized_name)

        # Determine stroke/fill based on style
        is_regular = style == "regular"

        # Get stroke-width from SVG if present (Iconoir regular uses 1.5)
        stroke_width = svg.get("stroke-width", "1.5") if is_regular else None

        return ExtractedIcon(
            source="iconoir",
            name=pascal_name,
            normalized_name=normalized_name,
            view_box=svg.get("viewBox", "0 0 24 24"),
            content=self.inner_content(svg),
            path_data=self.extract_paths(svg),
            default_stroke=is_regular,
            default_fill=not is_regular,
            stroke_width=str(stroke_width) if stroke_width else None,
            variant=None,  # Treat each style as separate icon
            category=self._guess_category(base_name),
            tags=self._generate_tags(base_name),
        )

    def _guess_category(self, name: str) -> str | None:
        """Guess category based on icon name patterns."""
        categories = {
            "arrows": ["arrow", "chevron", "nav", "direction"],
            "media": ["play", "pause", "stop", "volume", "mic", "video", "music", "camera", "film"],
            "files": ["file", "folder", "document", "page", "clipboard"],
            "communication": ["mail", "message", "phone", "send", "chat"],
            "weather": ["sun", "moon", "cloud", "rain", "snow", "wind"],
            "devices": ["monitor", "laptop", "tablet", "phone", "keyboard", "computer"],
            "social": ["share", "heart", "thumb", "star", "bookmark"],
            "navigation": ["home", "search", "menu", "grid", "list"],
            "editing": ["edit", "pen", "pencil", "scissors", "crop", "rotate"],
            "shapes": ["circle", "square", "triangle", "hexagon"],
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

        # Add common synonyms
        synonyms = {
            "arrow": ["direction", "pointer", "navigation"],
            "home": ["house", "main", "start"],
            "search": ["find", "magnify", "lookup"],
            "user": ["person", "account", "profile"],
            "settings": ["config", "preferences", "options", "gear"],
            "mail": ["email", "envelope", "message"],
            "heart": ["love", "favorite", "like"],
            "star": ["favorite", "rating", "bookmark"],
            "check": ["done", "complete", "success", "tick"],
            "cancel": ["close", "remove", "delete", "x"],
            "plus": ["add", "new", "create"],
            "minus": ["remove", "subtract", "less"],
        }

        for word in words:
            if word in synonyms:
                tags.extend(synonyms[word])

        return list(set(tags))
