"""Database registry for storing extracted icons."""
import json
from datetime import datetime
import libsql_experimental as libsql
from extractors.base import ExtractedIcon


class IconRegistry:
    """Manages icon storage in Turso database."""

    def __init__(self, turso_url: str, auth_token: str):
        self.conn = libsql.connect(turso_url, auth_token=auth_token)
        self._ensure_tables()

    def _ensure_tables(self):
        """Verify tables exist (created by Drizzle migrations)."""
        try:
            self.conn.execute("SELECT 1 FROM sources LIMIT 1")
            self.conn.execute("SELECT 1 FROM icons LIMIT 1")
            print("✓ Database tables verified")
        except Exception as e:
            raise RuntimeError(f"Database tables not found. Run Drizzle migrations first: {e}")

    def insert_source(self, source_id: str, name: str, version: str, license_info: str | None, total: int):
        """Insert or update a source/library."""
        now = int(datetime.now().timestamp())
        self.conn.execute(
            """
            INSERT INTO sources (id, name, version, license, total_icons, extracted_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                version = excluded.version,
                total_icons = excluded.total_icons,
                extracted_at = excluded.extracted_at
            """,
            (source_id, name, version, license_info, total, now),
        )
        self.conn.commit()
        print(f"✓ Source '{source_id}' registered (v{version}, {total} icons)")

    def insert_icon(self, icon: ExtractedIcon):
        """Insert a single icon."""
        icon_id = f"{icon.source}:{icon.normalized_name}"
        
        # Handle variant icons differently
        if icon.variant:
            self._insert_variant(icon)
            return

        self.conn.execute(
            """
            INSERT INTO icons 
            (id, source_id, name, normalized_name, category, tags, view_box, content, path_data, default_stroke, default_fill, stroke_width)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                category = excluded.category,
                tags = excluded.tags,
                content = excluded.content,
                path_data = excluded.path_data
            """,
            (
                icon_id,
                icon.source,
                icon.name,
                icon.normalized_name,
                icon.category,
                json.dumps(icon.tags) if icon.tags else None,
                icon.view_box,
                icon.content,
                json.dumps(icon.path_data) if icon.path_data else None,
                1 if icon.default_stroke else 0,
                1 if icon.default_fill else 0,
                icon.stroke_width,
            ),
        )

    def _insert_variant(self, icon: ExtractedIcon):
        """Insert an icon variant (e.g., Phosphor bold, fill)."""
        base_icon_id = f"{icon.source}:{icon.normalized_name}"
        variant_id = f"{icon.source}:{icon.normalized_name}:{icon.variant}"

        self.conn.execute(
            """
            INSERT INTO variants (id, icon_id, variant, content, path_data)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                content = excluded.content,
                path_data = excluded.path_data
            """,
            (
                variant_id,
                base_icon_id,
                icon.variant,
                icon.content,
                json.dumps(icon.path_data) if icon.path_data else None,
            ),
        )

    def batch_insert(self, icons: list[ExtractedIcon], batch_size: int = 100):
        """Insert icons in batches for better performance."""
        total = len(icons)
        inserted = 0
        errors = 0

        for i in range(0, total, batch_size):
            batch = icons[i : i + batch_size]
            for icon in batch:
                try:
                    self.insert_icon(icon)
                    inserted += 1
                except Exception as e:
                    errors += 1
                    print(f"  Error inserting {icon.source}:{icon.normalized_name}: {e}")

            self.conn.commit()
            print(f"  Progress: {min(i + batch_size, total)}/{total}")

        print(f"✓ Inserted {inserted} icons ({errors} errors)")
        return inserted, errors

    def get_icon_count(self, source_id: str | None = None) -> int:
        """Get total icon count, optionally filtered by source."""
        if source_id:
            result = self.conn.execute(
                "SELECT COUNT(*) FROM icons WHERE source_id = ?", (source_id,)
            ).fetchone()
        else:
            result = self.conn.execute("SELECT COUNT(*) FROM icons").fetchone()
        return result[0] if result else 0

    def clear_source(self, source_id: str):
        """Clear all icons from a source (for re-extraction)."""
        # Delete variants first (foreign key)
        self.conn.execute(
            "DELETE FROM variants WHERE icon_id LIKE ?", (f"{source_id}:%",)
        )
        # Delete icons
        self.conn.execute("DELETE FROM icons WHERE source_id = ?", (source_id,))
        self.conn.commit()
        print(f"✓ Cleared all icons from source '{source_id}'")
