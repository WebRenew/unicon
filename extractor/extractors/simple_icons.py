"""Extract icons from simple-icons package."""
import json
import re
from pathlib import Path
from .base import BaseExtractor, ExtractedIcon


class SimpleIconsExtractor(BaseExtractor):
    """Extract icons from simple-icons (brand logos)."""

    def __init__(self, node_modules: Path):
        self.icons_dir = node_modules / "simple-icons" / "icons"
        self.data_file = node_modules / "simple-icons" / "data" / "simple-icons.json"
        self.package_json = node_modules / "simple-icons" / "package.json"
        super().__init__(self.icons_dir)

    def get_version(self) -> str:
        """Get Simple Icons version from package.json."""
        try:
            with open(self.package_json) as f:
                pkg = json.load(f)
                return pkg.get("version", "unknown")
        except Exception as e:
            print(f"Error reading package.json: {e}")
            return "unknown"

    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all Simple Icons brand logos."""
        icons = []

        if not self.icons_dir.exists():
            raise FileNotFoundError(f"Simple Icons directory not found: {self.icons_dir}")

        if not self.data_file.exists():
            raise FileNotFoundError(f"Simple Icons data file not found: {self.data_file}")

        # Load metadata (titles, colors, slugs)
        with open(self.data_file) as f:
            icon_data = json.load(f)

        # Validate JSON structure
        if not isinstance(icon_data, list):
            raise TypeError(f"Expected icon data to be a list, got {type(icon_data).__name__}")

        if not icon_data:
            raise ValueError("Icon data list is empty")

        print(f"Found {len(icon_data)} Simple Icons in metadata")

        # Create lookup by slug with validation
        metadata_by_slug = {}
        for item in icon_data:
            if not isinstance(item, dict):
                print(f"  Warning: Skipping non-dict item: {item}")
                continue
            if "slug" not in item:
                print(f"  Warning: Skipping item without 'slug' field: {item}")
                continue
            metadata_by_slug[item["slug"]] = item

        # Process each SVG file
        svg_files = list(self.icons_dir.glob("*.svg"))
        print(f"Found {len(svg_files)} SVG files")

        for svg_file in svg_files:
            try:
                slug = svg_file.stem
                meta = metadata_by_slug.get(slug)

                if not meta:
                    print(f"  Warning: No metadata for {slug}")
                    continue

                icon = self.extract_one(svg_file, meta)
                icons.append(icon)
            except Exception as e:
                print(f"  Error extracting {svg_file.name}: {e}")

        return icons

    def extract_one(self, path: Path, meta: dict) -> ExtractedIcon:
        """Extract a single Simple Icons brand logo."""
        content = path.read_text()
        soup = self.parse_svg(content)
        svg = soup.find("svg")

        if not svg:
            raise ValueError(f"No SVG element found in {path}")

        # Get normalized name from slug
        normalized_name = meta["slug"]

        # Convert title to PascalCase name
        # Simple Icons titles can have special chars, so clean them
        title = meta["title"]
        pascal_name = self._title_to_pascal(title)

        # Get brand color (validate and add # prefix)
        brand_color = self._validate_hex_color(meta.get("hex", ""))

        # Generate tags from title and aliases
        tags = self._generate_tags(title, meta.get("aliases", {}))

        return ExtractedIcon(
            source="simple-icons",
            name=pascal_name,
            normalized_name=normalized_name,
            view_box=svg.get("viewBox", "0 0 24 24"),
            content=self.inner_content(svg),
            path_data=self.extract_paths(svg),
            default_stroke=False,  # Brand icons are fill-based
            default_fill=True,
            stroke_width=None,
            category="brands",  # All Simple Icons are brands
            tags=tags,
            brand_color=brand_color,
        )

    def _validate_hex_color(self, hex_str: str) -> str | None:
        """Validate and format hex color.
        
        Args:
            hex_str: Hex color string (with or without # prefix)
            
        Returns:
            Formatted hex color with # prefix, or None if invalid
        """
        if not hex_str:
            return None
        # Remove # if present
        hex_str = hex_str.lstrip('#')
        # Validate 6-digit hex
        if re.match(r'^[0-9A-Fa-f]{6}$', hex_str):
            return f"#{hex_str.upper()}"
        print(f"  Warning: Invalid hex color '{hex_str}'")
        return None

    def _title_to_pascal(self, title: str) -> str:
        """Convert brand title to PascalCase name.

        Examples:
            ".NET" -> "DotNet"
            "1Password" -> "1Password"
            "Adobe After Effects" -> "AdobeAfterEffects"
            "C++" -> "CPlusPlus"
        """
        import re

        # Replace special characters with words (do this for ALL occurrences)
        replacements = {
            ".": "Dot",
            "+": "Plus",
            "&": "And",
            "#": "Sharp",
            "@": "At",
        }

        result = title
        for char, word in replacements.items():
            # Replace all occurrences, adding space before/after for proper word splitting
            # Handle start of string
            if result.startswith(char):
                result = word + " " + result[1:]
            # Replace char with space-padded word for proper splitting
            result = result.replace(char, f" {word} ")

        # Remove remaining special characters except alphanumeric and spaces
        result = re.sub(r"[^a-zA-Z0-9\s]", "", result)

        # Split on spaces, remove empty strings, and capitalize each word
        words = [w for w in result.split() if w]
        pascal = "".join(word.capitalize() if word and word[0].isalpha() else word for word in words)

        return pascal

    def _generate_tags(self, title: str, aliases: dict) -> list[str]:
        """Generate search tags from title and aliases."""
        tags: set[str] = set()

        # Add lowercase title words
        tags.update(title.lower().split())

        # Add "brand" and "logo" as default tags
        tags.update(["brand", "logo"])

        # Add aliases if present
        if isinstance(aliases, dict):
            # Handle 'aka' (also known as) aliases
            aka = aliases.get("aka", [])
            if isinstance(aka, list):
                for alias in aka:
                    tags.update(alias.lower().split())

        return list(tags)
