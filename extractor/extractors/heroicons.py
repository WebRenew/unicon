import json
from pathlib import Path
from .base import BaseExtractor, ExtractedIcon


class HeroiconsExtractor(BaseExtractor):
    """Extract icons from @heroicons/react package."""

    def __init__(self, node_modules: Path):
        # Heroicons has 24x24/outline and 24x24/solid subdirectories
        self.base_dir = node_modules / "heroicons" / "24" / "outline"
        self.package_json = node_modules / "heroicons" / "package.json"
        super().__init__(self.base_dir)

    def get_version(self) -> str:
        """Get Heroicons version from package.json."""
        try:
            with open(self.package_json) as f:
                pkg = json.load(f)
                return pkg.get("version", "unknown")
        except Exception:
            return "unknown"

    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all Heroicons icons."""
        icons = []

        base_24 = self.package_json.parent / "24"

        if not base_24.exists():
            raise FileNotFoundError(f"Heroicons 24 directory not found: {base_24}")

        # Extract both outline and solid variants
        for style in ["outline", "solid"]:
            style_dir = base_24 / style
            if not style_dir.exists():
                print(f"Warning: {style} directory not found")
                continue

            svg_files = list(style_dir.glob("*.svg"))
            print(f"Found {len(svg_files)} Heroicons {style} icons")

            for svg_file in svg_files:
                try:
                    icon = self.extract_one(svg_file, style)
                    icons.append(icon)
                except Exception as e:
                    print(f"Error extracting {svg_file.name}: {e}")

        return icons

    def extract_one(self, path: Path, style: str) -> ExtractedIcon:
        """Extract a single Heroicons icon."""
        content = path.read_text()
        soup = self.parse_svg(content)
        svg = soup.find("svg")

        if not svg:
            raise ValueError(f"No SVG element found in {path}")

        # Heroicons uses kebab-case filenames
        # Add style suffix to normalized name to make outline/solid unique icons
        base_name = path.stem
        normalized_name = f"{base_name}-{style}"
        pascal_name = self.to_pascal(normalized_name)

        # Determine stroke/fill based on style
        is_outline = style == "outline"

        return ExtractedIcon(
            source="heroicons",
            name=pascal_name,
            normalized_name=normalized_name,
            view_box=svg.get("viewBox", "0 0 24 24"),
            content=self.inner_content(svg),
            path_data=self.extract_paths(svg),
            default_stroke=is_outline,
            default_fill=not is_outline,
            stroke_width="1.5" if is_outline else None,
            variant=None,  # Don't use variants to avoid FOREIGN KEY errors
            category=self._guess_category(base_name),
            tags=self._generate_tags(base_name),
        )

    def _guess_category(self, name: str) -> str | None:
        """Guess category based on icon name patterns."""
        categories = {
            "arrows": ["arrow", "chevron"],
            "media": ["play", "pause", "stop", "video", "music", "camera", "film"],
            "files": ["document", "folder", "paper", "clipboard"],
            "communication": ["envelope", "chat", "phone", "inbox"],
            "social": ["share", "heart", "hand-thumb", "star", "bookmark"],
            "navigation": ["home", "magnifying-glass", "bars", "list"],
            "editing": ["pencil", "scissors", "crop"],
            "shapes": ["square", "circle"],
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
            "magnifying-glass": ["search", "find", "lookup"],
            "envelope": ["mail", "email", "message"],
            "bars": ["menu", "hamburger"],
            "hand-thumb": ["like", "thumbs"],
        }

        for key, syns in synonyms.items():
            if key in name:
                tags.extend(syns)

        return list(set(tags))
