import json
from pathlib import Path
from .base import BaseExtractor, ExtractedIcon


class TablerExtractor(BaseExtractor):
    """Extract icons from @tabler/icons package."""

    def __init__(self, node_modules: Path):
        self.icons_dir = node_modules / "@tabler" / "icons" / "icons"
        self.package_json = node_modules / "@tabler" / "icons" / "package.json"
        super().__init__(self.icons_dir)

    def get_version(self) -> str:
        """Get Tabler Icons version from package.json."""
        try:
            with open(self.package_json) as f:
                pkg = json.load(f)
                return pkg.get("version", "unknown")
        except Exception:
            return "unknown"

    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all Tabler icons."""
        icons = []

        if not self.icons_dir.exists():
            raise FileNotFoundError(f"Tabler icons directory not found: {self.icons_dir}")

        # Tabler has outline and filled subdirectories
        for style in ["outline", "filled"]:
            style_dir = self.icons_dir / style
            if not style_dir.exists():
                print(f"Warning: {style} directory not found")
                continue

            svg_files = list(style_dir.glob("*.svg"))
            print(f"Found {len(svg_files)} Tabler {style} icons")

            for svg_file in svg_files:
                try:
                    icon = self.extract_one(svg_file, style)
                    icons.append(icon)
                except Exception as e:
                    print(f"Error extracting {svg_file.name}: {e}")

        return icons

    def extract_one(self, path: Path, style: str = "outline") -> ExtractedIcon:
        """Extract a single Tabler icon."""
        content = path.read_text()
        soup = self.parse_svg(content)
        svg = soup.find("svg")

        if not svg:
            raise ValueError(f"No SVG element found in {path}")

        # Tabler uses kebab-case filenames
        normalized_name = path.stem
        pascal_name = self.to_pascal(normalized_name)

        # Tabler outline icons are stroke-based, filled are fill-based
        is_outline = style == "outline"
        stroke_width = svg.get("stroke-width", "2") if is_outline else None

        return ExtractedIcon(
            source="tabler",
            name=pascal_name,
            normalized_name=normalized_name,
            view_box=svg.get("viewBox", "0 0 24 24"),
            content=self.inner_content(svg),
            path_data=self.extract_paths(svg),
            default_stroke=is_outline,
            default_fill=not is_outline,
            stroke_width=str(stroke_width) if stroke_width else None,
            variant=style if style != "outline" else None,
            category=self._guess_category(normalized_name),
            tags=self._generate_tags(normalized_name),
        )

    def _guess_category(self, name: str) -> str | None:
        """Guess category based on icon name patterns."""
        categories = {
            "arrows": ["arrow", "chevron", "direction"],
            "media": ["player", "music", "video", "camera", "microphone"],
            "files": ["file", "folder", "document"],
            "communication": ["mail", "message", "phone", "at"],
            "brand": ["brand-"],
            "devices": ["device-"],
            "social": ["share", "heart", "thumb", "star"],
            "navigation": ["home", "search", "menu", "layout"],
        }

        name_lower = name.lower()
        for category, keywords in categories.items():
            if any(kw in name_lower for kw in keywords):
                return category

        return "general"

    def _generate_tags(self, name: str) -> list[str]:
        """Generate tags from icon name."""
        words = name.split("-")
        return list(set(words))
