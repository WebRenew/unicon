from dataclasses import dataclass, field
from pathlib import Path
from abc import ABC, abstractmethod
from bs4 import BeautifulSoup


@dataclass
class ExtractedIcon:
    """Represents an extracted icon from any source."""
    source: str
    name: str  # PascalCase
    normalized_name: str  # kebab-case
    view_box: str
    content: str  # Inner SVG content
    path_data: list[dict]
    default_stroke: bool
    default_fill: bool
    stroke_width: str | None = None
    category: str | None = None
    tags: list[str] = field(default_factory=list)
    variant: str | None = None  # For Phosphor weights
    brand_color: str | None = None  # For Simple Icons brand colors (hex with #)


class BaseExtractor(ABC):
    """Base class for icon extractors."""

    def __init__(self, source_path: Path):
        self.source_path = source_path

    @abstractmethod
    def extract_all(self) -> list[ExtractedIcon]:
        """Extract all icons from the source."""
        pass

    @abstractmethod
    def get_version(self) -> str:
        """Get the version of the icon library."""
        pass

    @staticmethod
    def to_pascal(kebab: str) -> str:
        """Convert kebab-case to PascalCase."""
        return "".join(word.capitalize() for word in kebab.split("-"))

    @staticmethod
    def to_kebab(pascal: str) -> str:
        """Convert PascalCase to kebab-case."""
        import re
        s1 = re.sub("(.)([A-Z][a-z]+)", r"\1-\2", pascal)
        return re.sub("([a-z0-9])([A-Z])", r"\1-\2", s1).lower()

    @staticmethod
    def extract_paths(svg: BeautifulSoup) -> list[dict]:
        """Extract SVG path elements with their attributes."""
        elements = []
        for el in svg.find_all(["path", "circle", "rect", "line", "polyline", "polygon", "ellipse"]):
            elements.append({
                "tag": el.name,
                "attrs": {k: v for k, v in el.attrs.items()}
            })
        return elements

    @staticmethod
    def inner_content(svg: BeautifulSoup) -> str:
        """Get the inner content of an SVG element."""
        return "".join(str(child) for child in svg.children if str(child).strip())

    @staticmethod
    def parse_svg(content: str) -> BeautifulSoup:
        """Parse SVG content."""
        return BeautifulSoup(content, "xml")
