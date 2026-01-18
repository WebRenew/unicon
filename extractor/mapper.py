"""Cross-library icon mapping using fuzzy matching."""
import json
from rapidfuzz import fuzz, process
import libsql_experimental as libsql


class IconMapper:
    """Maps equivalent icons across libraries."""

    def __init__(self, turso_url: str, auth_token: str):
        self.conn = libsql.connect(turso_url, auth_token=auth_token)

    def get_icons_by_source(self, source_id: str) -> dict[str, str]:
        """Get all icon names for a source. Returns {normalized_name: id}."""
        result = self.conn.execute(
            "SELECT id, normalized_name FROM icons WHERE source_id = ?",
            (source_id,),
        ).fetchall()
        return {row[1]: row[0] for row in result}

    def auto_map(self, confidence_threshold: int = 80):
        """
        Automatically map icons across libraries using fuzzy matching.
        Uses Lucide as the canonical reference.
        """
        print("Starting auto-mapping...")

        # Get icons from each source
        lucide_icons = self.get_icons_by_source("lucide")
        phosphor_icons = self.get_icons_by_source("phosphor")
        hugeicons_icons = self.get_icons_by_source("hugeicons")

        print(f"  Lucide: {len(lucide_icons)} icons")
        print(f"  Phosphor: {len(phosphor_icons)} icons")
        print(f"  HugeIcons: {len(hugeicons_icons)} icons")

        phosphor_names = list(phosphor_icons.keys())
        hugeicons_names = list(hugeicons_icons.keys())

        mappings = []
        for lucide_name, lucide_id in lucide_icons.items():
            mapping = {
                "canonical_name": lucide_name,
                "lucide_id": lucide_id,
                "phosphor_id": None,
                "hugeicons_id": None,
                "confidence": 100,
                "needs_review": False,
            }

            # Find best Phosphor match
            if phosphor_names:
                phosphor_match = process.extractOne(
                    lucide_name, phosphor_names, scorer=fuzz.ratio
                )
                if phosphor_match and phosphor_match[1] >= confidence_threshold:
                    mapping["phosphor_id"] = phosphor_icons[phosphor_match[0]]
                    mapping["confidence"] = min(mapping["confidence"], phosphor_match[1])
                    if phosphor_match[1] < 90:
                        mapping["needs_review"] = True

            # Find best HugeIcons match
            if hugeicons_names:
                huge_match = process.extractOne(
                    lucide_name, hugeicons_names, scorer=fuzz.ratio
                )
                if huge_match and huge_match[1] >= confidence_threshold:
                    mapping["hugeicons_id"] = hugeicons_icons[huge_match[0]]
                    mapping["confidence"] = min(mapping["confidence"], huge_match[1])
                    if huge_match[1] < 90:
                        mapping["needs_review"] = True

            mappings.append(mapping)

        return mappings

    def save_mappings(self, mappings: list[dict]):
        """Save mappings to database."""
        # Clear existing mappings
        self.conn.execute("DELETE FROM mappings")

        for m in mappings:
            self.conn.execute(
                """
                INSERT INTO mappings (canonical_name, lucide_id, phosphor_id, hugeicons_id, confidence, needs_review)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    m["canonical_name"],
                    m["lucide_id"],
                    m["phosphor_id"],
                    m["hugeicons_id"],
                    m["confidence"],
                    1 if m["needs_review"] else 0,
                ),
            )

        self.conn.commit()
        print(f"✓ Saved {len(mappings)} mappings")

        # Stats
        with_phosphor = sum(1 for m in mappings if m["phosphor_id"])
        with_hugeicons = sum(1 for m in mappings if m["hugeicons_id"])
        needs_review = sum(1 for m in mappings if m["needs_review"])

        print(f"  Phosphor matches: {with_phosphor}")
        print(f"  HugeIcons matches: {with_hugeicons}")
        print(f"  Needs review: {needs_review}")

    def get_review_queue(self) -> list[dict]:
        """Get mappings that need manual review."""
        result = self.conn.execute(
            """
            SELECT canonical_name, lucide_id, phosphor_id, hugeicons_id, confidence
            FROM mappings
            WHERE needs_review = 1
            ORDER BY confidence ASC
            """
        ).fetchall()

        return [
            {
                "canonical_name": row[0],
                "lucide_id": row[1],
                "phosphor_id": row[2],
                "hugeicons_id": row[3],
                "confidence": row[4],
            }
            for row in result
        ]

    def export_mappings_json(self, filepath: str):
        """Export mappings to JSON for inspection."""
        result = self.conn.execute(
            """
            SELECT canonical_name, lucide_id, phosphor_id, hugeicons_id, confidence, needs_review
            FROM mappings
            ORDER BY canonical_name
            """
        ).fetchall()

        mappings = [
            {
                "canonical_name": row[0],
                "lucide_id": row[1],
                "phosphor_id": row[2],
                "hugeicons_id": row[3],
                "confidence": row[4],
                "needs_review": bool(row[5]),
            }
            for row in result
        ]

        with open(filepath, "w") as f:
            json.dump(mappings, f, indent=2)

        print(f"✓ Exported {len(mappings)} mappings to {filepath}")
