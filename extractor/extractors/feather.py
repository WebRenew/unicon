import json
from pathlib import Path
from .base import BaseExtractor, ExtractedIcon


class FeatherExtractor(BaseExtractor):
    """Extract icons from feather-icons package."""

    def __init__(self, node_modules: Path):
        self.icons_dir = node_modules / "feather-icons" / "dist" / "icons"
        self.package_json = node_modules / "feather-icons" / "package.json"
        super().__init__(self.icons_dir)

    def get_version(self) -> str:
        """Get Feather Icons version from package.json."""
        try:
            with open(self.package_json) as f:
                pkg = json.load(f)
                return pkg.get("version", "unknown")
        except Exception:
            return "unknown"

    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all Feather icons."""
        icons = []

        if not self.icons_dir.exists():
            raise FileNotFoundError(f"Feather icons directory not found: {self.icons_dir}")

        svg_files = list(self.icons_dir.glob("*.svg"))
        print(f"Found {len(svg_files)} Feather icons")

        for svg_file in svg_files:
            try:
                icon = self.extract_one(svg_file)
                icons.append(icon)
            except Exception as e:
                print(f"Error extracting {svg_file.name}: {e}")

        return icons

    def extract_one(self, path: Path) -> ExtractedIcon:
        """Extract a single Feather icon."""
        content = path.read_text()
        soup = self.parse_svg(content)
        svg = soup.find("svg")

        if not svg:
            raise ValueError(f"No SVG element found in {path}")

        # Feather uses kebab-case filenames
        normalized_name = path.stem
        pascal_name = self.to_pascal(normalized_name)

        # Feather icons are stroke-based
        stroke_width = svg.get("stroke-width", "2")

        return ExtractedIcon(
            source="feather",
            name=pascal_name,
            normalized_name=normalized_name,
            view_box=svg.get("viewBox", "0 0 24 24"),
            content=self.inner_content(svg),
            path_data=self.extract_paths(svg),
            default_stroke=True,
            default_fill=False,
            stroke_width=str(stroke_width),
            category=self._guess_category(normalized_name),
            tags=self._generate_tags(normalized_name),
        )

    def _guess_category(self, name: str) -> str | None:
        """Guess category based on icon name patterns."""
        categories = {
            "arrows": ["arrow", "chevron"],
            "media": ["play", "pause", "stop", "volume", "mic", "video", "music", "camera"],
            "files": ["file", "folder"],
            "communication": ["mail", "message", "phone"],
            "social": ["share", "heart", "thumbs", "star"],
            "navigation": ["home", "search", "menu"],
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
