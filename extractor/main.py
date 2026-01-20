#!/usr/bin/env python3
"""
Unicon Icon Extractor

Extracts icons from Lucide, Phosphor, and HugeIcons packages
and stores them in the Turso database.

Usage:
    python main.py                    # Extract all libraries
    python main.py --source lucide    # Extract only Lucide
    python main.py --map              # Run cross-library mapping
    python main.py --clear lucide     # Clear and re-extract Lucide
"""
import os
import sys
import argparse
import subprocess
from pathlib import Path
from dotenv import load_dotenv

from extractors import (
    LucideExtractor,
    PhosphorExtractor,
    HugeIconsExtractor,
    HeroiconsExtractor,
    TablerExtractor,
    FeatherExtractor,
    RemixExtractor,
    SimpleIconsExtractor,
)
from registry import IconRegistry
from mapper import IconMapper


# Icon package versions (update as needed)
PACKAGES = {
    "lucide": {
        "npm": "lucide-static",
        "name": "Lucide",
        "license": "ISC",
    },
    "phosphor": {
        "npm": "@phosphor-icons/core",
        "name": "Phosphor",
        "license": "MIT",
    },
    "hugeicons": {
        "npm": "hugeicons-react",
        "name": "HugeIcons",
        "license": "MIT",
    },
    "heroicons": {
        "npm": "heroicons",
        "name": "Heroicons",
        "license": "MIT",
    },
    "tabler": {
        "npm": "@tabler/icons",
        "name": "Tabler Icons",
        "license": "MIT",
    },
    "feather": {
        "npm": "feather-icons",
        "name": "Feather Icons",
        "license": "MIT",
    },
    "remix": {
        "npm": "remixicon",
        "name": "Remix Icon",
        "license": "Apache-2.0",
    },
    "simple-icons": {
        "npm": "simple-icons",
        "name": "Simple Icons",
        "license": "CC0-1.0",
    },
}


def setup_npm_packages(tmp_dir: Path, sources: list[str]) -> Path:
    """Install required npm packages for extraction."""
    tmp_dir.mkdir(exist_ok=True)

    packages_to_install = [PACKAGES[s]["npm"] for s in sources if s in PACKAGES]

    if not packages_to_install:
        raise ValueError(f"No valid sources specified: {sources}")

    print(f"Installing npm packages: {', '.join(packages_to_install)}")

    # Create minimal package.json
    package_json = tmp_dir / "package.json"
    if not package_json.exists():
        package_json.write_text('{"name": "tmp", "private": true}')

    result = subprocess.run(
        ["npm", "install", "--no-save"] + packages_to_install,
        cwd=tmp_dir,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"npm install stderr: {result.stderr}")
        raise RuntimeError(f"Failed to install npm packages: {result.returncode}")

    print("✓ npm packages installed")
    return tmp_dir / "node_modules"


def extract_lucide(registry: IconRegistry, node_modules: Path) -> int:
    """Extract Lucide icons."""
    print("\n" + "=" * 50)
    print("Extracting Lucide icons...")
    print("=" * 50)

    extractor = LucideExtractor(node_modules)
    version = extractor.get_version()
    icons = extractor.extract_all()

    # Filter out variants (Lucide doesn't have them, but just in case)
    base_icons = [i for i in icons if i.variant is None]

    registry.insert_source(
        "lucide",
        PACKAGES["lucide"]["name"],
        version,
        PACKAGES["lucide"]["license"],
        len(base_icons),
    )
    inserted, _ = registry.batch_insert(icons)
    return inserted


def extract_phosphor(registry: IconRegistry, node_modules: Path) -> int:
    """Extract Phosphor icons."""
    print("\n" + "=" * 50)
    print("Extracting Phosphor icons...")
    print("=" * 50)

    extractor = PhosphorExtractor(node_modules)
    version = extractor.get_version()
    icons = extractor.extract_all()

    # Count unique base icons (not variants)
    base_icons = [i for i in icons if i.variant is None]
    variant_icons = [i for i in icons if i.variant is not None]

    print(f"  Base icons: {len(base_icons)}")
    print(f"  Variant icons: {len(variant_icons)}")

    registry.insert_source(
        "phosphor",
        PACKAGES["phosphor"]["name"],
        version,
        PACKAGES["phosphor"]["license"],
        len(base_icons),
    )

    # Insert base icons first, then variants
    inserted_base, _ = registry.batch_insert(base_icons)
    inserted_variants, _ = registry.batch_insert(variant_icons)

    return inserted_base + inserted_variants


def extract_hugeicons(registry: IconRegistry, node_modules: Path) -> int:
    """Extract HugeIcons icons."""
    print("\n" + "=" * 50)
    print("Extracting HugeIcons icons...")
    print("=" * 50)

    extractor = HugeIconsExtractor(node_modules)
    version = extractor.get_version()
    icons = extractor.extract_all()

    if not icons:
        print("⚠ No HugeIcons extracted (package structure may differ)")
        return 0

    registry.insert_source(
        "hugeicons",
        PACKAGES["hugeicons"]["name"],
        version,
        PACKAGES["hugeicons"]["license"],
        len(icons),
    )
    inserted, _ = registry.batch_insert(icons)
    return inserted


def extract_heroicons(registry: IconRegistry, node_modules: Path) -> int:
    """Extract Heroicons icons."""
    print("\n" + "=" * 50)
    print("Extracting Heroicons icons...")
    print("=" * 50)

    extractor = HeroiconsExtractor(node_modules)
    version = extractor.get_version()
    icons = extractor.extract_all()

    base_icons = [i for i in icons if i.variant is None or i.variant == "outline"]

    registry.insert_source(
        "heroicons",
        PACKAGES["heroicons"]["name"],
        version,
        PACKAGES["heroicons"]["license"],
        len(base_icons),
    )
    inserted, _ = registry.batch_insert(icons)
    return inserted


def extract_tabler(registry: IconRegistry, node_modules: Path) -> int:
    """Extract Tabler Icons icons."""
    print("\n" + "=" * 50)
    print("Extracting Tabler Icons icons...")
    print("=" * 50)

    extractor = TablerExtractor(node_modules)
    version = extractor.get_version()
    icons = extractor.extract_all()

    registry.insert_source(
        "tabler",
        PACKAGES["tabler"]["name"],
        version,
        PACKAGES["tabler"]["license"],
        len(icons),
    )
    inserted, _ = registry.batch_insert(icons)
    return inserted


def extract_feather(registry: IconRegistry, node_modules: Path) -> int:
    """Extract Feather Icons icons."""
    print("\n" + "=" * 50)
    print("Extracting Feather Icons icons...")
    print("=" * 50)

    extractor = FeatherExtractor(node_modules)
    version = extractor.get_version()
    icons = extractor.extract_all()

    registry.insert_source(
        "feather",
        PACKAGES["feather"]["name"],
        version,
        PACKAGES["feather"]["license"],
        len(icons),
    )
    inserted, _ = registry.batch_insert(icons)
    return inserted


def extract_remix(registry: IconRegistry, node_modules: Path) -> int:
    """Extract Remix Icon icons."""
    print("\n" + "=" * 50)
    print("Extracting Remix Icon icons...")
    print("=" * 50)

    extractor = RemixExtractor(node_modules)
    version = extractor.get_version()
    icons = extractor.extract_all()

    registry.insert_source(
        "remix",
        PACKAGES["remix"]["name"],
        version,
        PACKAGES["remix"]["license"],
        len(icons),
    )
    inserted, _ = registry.batch_insert(icons)
    return inserted


def extract_simple_icons(registry: IconRegistry, node_modules: Path) -> int:
    """Extract Simple Icons brand logos."""
    print("\n" + "=" * 50)
    print("Extracting Simple Icons (brand logos)...")
    print("=" * 50)

    extractor = SimpleIconsExtractor(node_modules)
    version = extractor.get_version()
    icons = extractor.extract_all()

    if not icons:
        print("⚠ No Simple Icons extracted")
        return 0

    registry.insert_source(
        "simple-icons",
        PACKAGES["simple-icons"]["name"],
        version,
        PACKAGES["simple-icons"]["license"],
        len(icons),
    )
    inserted, _ = registry.batch_insert(icons)
    return inserted


def run_mapping(turso_url: str, auth_token: str):
    """Run cross-library mapping."""
    print("\n" + "=" * 50)
    print("Running cross-library mapping...")
    print("=" * 50)

    mapper = IconMapper(turso_url, auth_token)
    mappings = mapper.auto_map(confidence_threshold=80)
    mapper.save_mappings(mappings)

    # Export for review
    mapper.export_mappings_json("./mappings.json")


def main():
    parser = argparse.ArgumentParser(description="Extract icons from icon libraries")
    parser.add_argument(
        "--source",
        choices=[
            "lucide",
            "phosphor",
            "hugeicons",
            "heroicons",
            "tabler",
            "feather",
            "remix",
            "simple-icons",
            "all",
        ],
        default="all",
        help="Which source to extract (default: all)",
    )
    parser.add_argument(
        "--map",
        action="store_true",
        help="Run cross-library mapping after extraction",
    )
    parser.add_argument(
        "--map-only",
        action="store_true",
        help="Only run mapping (skip extraction)",
    )
    parser.add_argument(
        "--clear",
        metavar="SOURCE",
        help="Clear existing icons for a source before extracting",
    )
    parser.add_argument(
        "--tmp-dir",
        type=Path,
        default=Path("./tmp_extract"),
        help="Temporary directory for npm packages",
    )
    args = parser.parse_args()

    # Load environment variables
    load_dotenv(Path(__file__).parent.parent / ".env.local")

    turso_url = os.environ.get("TURSO_DATABASE_URL")
    auth_token = os.environ.get("TURSO_AUTH_TOKEN")

    if not turso_url or not auth_token:
        print("Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")
        print("Make sure .env.local exists in the project root")
        sys.exit(1)

    # Handle mapping-only mode
    if args.map_only:
        run_mapping(turso_url, auth_token)
        return

    # Connect to database
    registry = IconRegistry(turso_url, auth_token)

    # Clear source if requested
    if args.clear:
        registry.clear_source(args.clear)

    # Determine sources to extract
    if args.source == "all":
        sources = [
            "lucide",
            "phosphor",
            "hugeicons",
            "heroicons",
            "tabler",
            "feather",
            "remix",
            "simple-icons",
        ]
    else:
        sources = [args.source]

    # Setup npm packages
    node_modules = setup_npm_packages(args.tmp_dir, sources)

    # Extract each source
    total_extracted = 0

    if "lucide" in sources:
        total_extracted += extract_lucide(registry, node_modules)

    if "phosphor" in sources:
        total_extracted += extract_phosphor(registry, node_modules)

    if "hugeicons" in sources:
        total_extracted += extract_hugeicons(registry, node_modules)

    if "heroicons" in sources:
        total_extracted += extract_heroicons(registry, node_modules)

    if "tabler" in sources:
        total_extracted += extract_tabler(registry, node_modules)

    if "feather" in sources:
        total_extracted += extract_feather(registry, node_modules)

    if "remix" in sources:
        total_extracted += extract_remix(registry, node_modules)

    if "simple-icons" in sources:
        total_extracted += extract_simple_icons(registry, node_modules)

    print("\n" + "=" * 50)
    print(f"EXTRACTION COMPLETE: {total_extracted} total icons")
    print("=" * 50)

    # Run mapping if requested
    if args.map:
        run_mapping(turso_url, auth_token)

    # Print summary
    print("\nDatabase summary:")
    for source in sources:
        count = registry.get_icon_count(source)
        print(f"  {source}: {count} icons")

    print(f"\nTotal in database: {registry.get_icon_count()}")


if __name__ == "__main__":
    main()
