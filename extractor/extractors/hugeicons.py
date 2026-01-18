import json
import re
from pathlib import Path
from .base import BaseExtractor, ExtractedIcon


class HugeIconsExtractor(BaseExtractor):
    """Extract icons from hugeicons-react package."""

    def __init__(self, node_modules: Path):
        # HugeIcons stores icon components in dist/esm/icons/
        self.icons_dir = node_modules / "hugeicons-react" / "dist" / "esm" / "icons"
        self.package_json = node_modules / "hugeicons-react" / "package.json"
        super().__init__(self.icons_dir)

    def get_version(self) -> str:
        """Get HugeIcons version from package.json."""
        try:
            with open(self.package_json) as f:
                pkg = json.load(f)
                return pkg.get("version", "unknown")
        except Exception:
            return "unknown"

    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all HugeIcons icons from JS files."""
        icons = []
        
        if not self.icons_dir.exists():
            print(f"HugeIcons directory not found: {self.icons_dir}")
            return []

        js_files = list(self.icons_dir.glob("*_icon.js"))
        print(f"Found {len(js_files)} HugeIcons icon files")

        for js_file in js_files:
            try:
                icon = self.extract_from_js(js_file)
                if icon:
                    icons.append(icon)
            except Exception as e:
                print(f"Error extracting {js_file.name}: {e}")

        return icons

    def extract_from_js(self, path: Path) -> ExtractedIcon | None:
        """Extract icon data from a HugeIcons JS component file."""
        content = path.read_text()

        # Extract icon name from createHugeIconComponent call
        # Pattern: r("IconName", [...])
        name_match = re.search(r'r\("(\w+)"', content)
        if not name_match:
            return None

        pascal_name = name_match.group(1).replace("Icon", "")
        normalized_name = self.to_kebab(pascal_name)

        # Extract SVG elements - they're in an array after the name
        # Pattern: [["path",{d:"...",stroke:"currentColor",key:"k0"}]]
        elements_match = re.search(r'\[(\[.*?\])\]', content, re.DOTALL)
        if not elements_match:
            return None

        elements_str = elements_match.group(0)
        
        # Parse the elements to build SVG content
        svg_elements = self._parse_elements(elements_str)
        
        if not svg_elements:
            return None

        # Build SVG content
        svg_content = self._build_svg_content(svg_elements)
        path_data = self._extract_path_data(svg_elements)

        # Determine if stroke or fill based
        is_stroke = any(
            'stroke' in elem.get('attrs', {}) 
            for elem in path_data
        )

        return ExtractedIcon(
            source="hugeicons",
            name=pascal_name,
            normalized_name=normalized_name,
            view_box="0 0 24 24",
            content=svg_content,
            path_data=path_data,
            default_stroke=is_stroke,
            default_fill=not is_stroke,
            stroke_width="1.5",  # HugeIcons default
            category=self._guess_category(normalized_name),
            tags=self._generate_tags(normalized_name),
        )

    def _parse_elements(self, elements_str: str) -> list[dict]:
        """Parse HugeIcons element array into structured data."""
        elements = []
        
        # Find all element definitions: ["tag",{attrs}]
        element_pattern = r'\["(\w+)",\{([^}]+)\}'
        
        for match in re.finditer(element_pattern, elements_str):
            tag = match.group(1)
            attrs_str = match.group(2)
            
            # Parse attributes
            attrs = {}
            # Match key:"value" or key:'value'
            attr_pattern = r'(\w+):\s*["\']([^"\']*)["\']'
            for attr_match in re.finditer(attr_pattern, attrs_str):
                key = attr_match.group(1)
                value = attr_match.group(2)
                # Skip internal keys
                if key not in ('key',):
                    attrs[key] = value
            
            elements.append({'tag': tag, 'attrs': attrs})
        
        return elements

    def _build_svg_content(self, elements: list[dict]) -> str:
        """Build SVG inner content from parsed elements."""
        parts = []
        for elem in elements:
            tag = elem['tag']
            attrs = elem['attrs']
            
            # Build attribute string
            attr_str = ' '.join(f'{k}="{v}"' for k, v in attrs.items())
            
            if tag in ('path', 'circle', 'line', 'polyline', 'polygon'):
                parts.append(f'<{tag} {attr_str}/>')
            else:
                parts.append(f'<{tag} {attr_str}></{tag}>')
        
        return ''.join(parts)

    def _extract_path_data(self, elements: list[dict]) -> list[dict]:
        """Extract path data in standard format."""
        return [
            {
                'tag': elem['tag'],
                'attrs': elem['attrs']
            }
            for elem in elements
        ]

    def _guess_category(self, name: str) -> str | None:
        """Guess category based on icon name patterns."""
        categories = {
            "arrows": ["arrow", "chevron", "direction", "left", "right", "up", "down"],
            "media": ["play", "pause", "stop", "volume", "mic", "video", "music", "camera", "record"],
            "files": ["file", "folder", "document", "copy", "clipboard"],
            "communication": ["mail", "message", "phone", "send", "chat", "comment"],
            "weather": ["sun", "moon", "cloud", "rain", "snow", "weather"],
            "devices": ["monitor", "laptop", "tablet", "mobile", "printer", "computer"],
            "social": ["share", "heart", "like", "star", "bookmark", "thumb"],
            "navigation": ["home", "menu", "search", "filter", "grid", "list"],
            "editing": ["edit", "pen", "pencil", "scissors", "crop", "brush"],
            "shapes": ["circle", "square", "triangle", "hexagon"],
            "users": ["user", "person", "account", "profile", "team"],
        }

        name_lower = name.lower()
        for category, keywords in categories.items():
            if any(kw in name_lower for kw in keywords):
                return category

        return "general"

    def _generate_tags(self, name: str) -> list[str]:
        """Generate tags from icon name."""
        # Split on common separators and numbers
        words = re.split(r'[-_]|\d+', name)
        words = [w for w in words if w]  # Remove empty strings
        return list(set(words))
