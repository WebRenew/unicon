import json
from pathlib import Path
from .base import BaseExtractor, ExtractedIcon


class RemixExtractor(BaseExtractor):
    """Extract icons from remixicon package."""

    def __init__(self, node_modules: Path):
        self.icons_dir = node_modules / "remixicon" / "icons"
        self.package_json = node_modules / "remixicon" / "package.json"
        super().__init__(self.icons_dir)

    def get_version(self) -> str:
        """Get Remix Icon version from package.json."""
        try:
            with open(self.package_json) as f:
                pkg = json.load(f)
                return pkg.get("version", "unknown")
        except Exception:
            return "unknown"

    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all Remix icons."""
        icons = []

        if not self.icons_dir.exists():
            raise FileNotFoundError(f"Remix icons directory not found: {self.icons_dir}")

        # Remix has category subdirectories
        for category_dir in self.icons_dir.iterdir():
            if not category_dir.is_dir():
                continue

            svg_files = list(category_dir.glob("*.svg"))
            print(f"Found {len(svg_files)} Remix icons in {category_dir.name}")

            for svg_file in svg_files:
                try:
                    icon = self.extract_one(svg_file, category_dir.name)
                    icons.append(icon)
                except Exception as e:
                    print(f"Error extracting {svg_file.name}: {e}")

        return icons

    def extract_one(self, path: Path, category: str) -> ExtractedIcon:
        """Extract a single Remix icon."""
        content = path.read_text()
        soup = self.parse_svg(content)
        svg = soup.find("svg")

        if not svg:
            raise ValueError(f"No SVG element found in {path}")

        # Remix uses kebab-case filenames with -line or -fill suffix
        normalized_name = path.stem
        pascal_name = self.to_pascal(normalized_name)

        # Remix icons all have -line or -fill suffixes, they are base icons not variants
        # Don't treat as variants since there's no base icon without the suffix
        return ExtractedIcon(
            source="remix",
            name=pascal_name,
            normalized_name=normalized_name,
            view_box=svg.get("viewBox", "0 0 24 24"),
            content=self.inner_content(svg),
            path_data=self.extract_paths(svg),
            default_stroke=False,
            default_fill=True,
            variant=None,  # Don't use variants for Remix
            category=category,
            tags=self._generate_tags(normalized_name),
        )

    def _generate_tags(self, name: str) -> list[str]:
        """Generate tags from icon name."""
        words = name.split("-")
        return list(set(words))
