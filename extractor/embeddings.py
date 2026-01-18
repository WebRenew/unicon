#!/usr/bin/env python3
"""
Generate embeddings for icons using AI Gateway.

Usage:
    python embeddings.py                    # Generate embeddings for all icons
    python embeddings.py --source lucide    # Generate only for Lucide icons
    python embeddings.py --batch-size 50    # Adjust batch size
"""
import os
import sys
import json
import struct
import argparse
from pathlib import Path
import libsql_experimental as libsql
from dotenv import load_dotenv
import urllib.request
import urllib.error


class EmbeddingGenerator:
    """Generate and store embeddings for icons."""

    EMBEDDING_MODEL = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS = 1536  # OpenAI text-embedding-3-small dimensions

    def __init__(self, turso_url: str, auth_token: str, api_key: str, gateway_url: str | None = None):
        self.conn = libsql.connect(turso_url, auth_token=auth_token)
        self.api_key = api_key
        # Default to OpenAI endpoint if no gateway specified
        self.gateway_url = gateway_url or "https://api.openai.com/v1"

    def get_icons_without_embeddings(self, source_id: str | None = None, limit: int = 1000) -> list[dict]:
        """Get icons that don't have embeddings yet."""
        if source_id:
            result = self.conn.execute(
                """
                SELECT id, name, normalized_name, category, tags
                FROM icons 
                WHERE embedding IS NULL AND source_id = ?
                LIMIT ?
                """,
                (source_id, limit),
            ).fetchall()
        else:
            result = self.conn.execute(
                """
                SELECT id, name, normalized_name, category, tags
                FROM icons 
                WHERE embedding IS NULL
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [
            {
                "id": row[0],
                "name": row[1],
                "normalized_name": row[2],
                "category": row[3],
                "tags": json.loads(row[4]) if row[4] else [],
            }
            for row in result
        ]

    def build_search_text(self, icon: dict) -> str:
        """Build search text from icon metadata for embedding."""
        parts = []

        # Add normalized name (split kebab-case into words)
        name_words = icon["normalized_name"].replace("-", " ")
        parts.append(name_words)

        # Add category if present
        if icon["category"]:
            parts.append(icon["category"])

        # Add tags
        if icon["tags"]:
            parts.extend(icon["tags"])

        # Deduplicate and join
        unique_parts = list(dict.fromkeys(parts))  # Preserve order, remove dupes
        return " ".join(unique_parts)

    def get_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        """Get embeddings for a batch of texts from AI Gateway."""
        url = f"{self.gateway_url}/embeddings"

        payload = json.dumps({
            "model": self.EMBEDDING_MODEL,
            "input": texts,
        }).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read().decode("utf-8"))
                # Sort by index to ensure correct order
                sorted_data = sorted(result["data"], key=lambda x: x["index"])
                return [item["embedding"] for item in sorted_data]
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else "No error body"
            raise RuntimeError(f"Embedding API error {e.code}: {error_body}")

    def embedding_to_blob(self, embedding: list[float]) -> bytes:
        """Convert embedding list to binary blob (F32 format for libSQL)."""
        return struct.pack(f"{len(embedding)}f", *embedding)

    def update_icon_embedding(self, icon_id: str, search_text: str, embedding: list[float]):
        """Update icon with search text and embedding."""
        embedding_blob = self.embedding_to_blob(embedding)

        self.conn.execute(
            """
            UPDATE icons 
            SET search_text = ?, embedding = ?
            WHERE id = ?
            """,
            (search_text, embedding_blob, icon_id),
        )

    def process_batch(self, icons: list[dict]) -> int:
        """Process a batch of icons - generate and store embeddings."""
        if not icons:
            return 0

        # Build search texts
        search_texts = [self.build_search_text(icon) for icon in icons]

        # Get embeddings from API
        embeddings = self.get_embeddings_batch(search_texts)

        # Store in database
        for icon, search_text, embedding in zip(icons, search_texts, embeddings):
            self.update_icon_embedding(icon["id"], search_text, embedding)

        self.conn.commit()
        return len(icons)

    def generate_all(self, source_id: str | None = None, batch_size: int = 100):
        """Generate embeddings for all icons without them."""
        total_processed = 0

        while True:
            icons = self.get_icons_without_embeddings(source_id, limit=batch_size)
            if not icons:
                break

            processed = self.process_batch(icons)
            total_processed += processed
            print(f"  Processed {total_processed} icons...")

        return total_processed

    def get_embedding_stats(self) -> dict:
        """Get statistics on embedding coverage."""
        result = self.conn.execute(
            """
            SELECT 
                source_id,
                COUNT(*) as total,
                SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embedding
            FROM icons
            GROUP BY source_id
            """
        ).fetchall()

        return {
            row[0]: {"total": row[1], "with_embedding": row[2]}
            for row in result
        }


def main():
    parser = argparse.ArgumentParser(description="Generate embeddings for icons")
    parser.add_argument(
        "--source",
        choices=["lucide", "phosphor", "hugeicons"],
        help="Only process icons from this source",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Number of icons to process per API call (default: 100)",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Show embedding statistics and exit",
    )
    args = parser.parse_args()

    # Load environment variables
    load_dotenv(Path(__file__).parent.parent / ".env.local")

    turso_url = os.environ.get("TURSO_DATABASE_URL")
    auth_token = os.environ.get("TURSO_AUTH_TOKEN")
    api_key = os.environ.get("AI_GATEWAY_API_KEY")
    gateway_url = os.environ.get("AI_GATEWAY_URL")  # Optional

    if not turso_url or not auth_token:
        print("Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")
        sys.exit(1)

    if not api_key:
        print("Error: AI_GATEWAY_API_KEY must be set")
        sys.exit(1)

    generator = EmbeddingGenerator(turso_url, auth_token, api_key, gateway_url)

    # Show stats
    if args.stats:
        print("\nEmbedding Statistics:")
        print("=" * 50)
        stats = generator.get_embedding_stats()
        for source, data in stats.items():
            pct = (data["with_embedding"] / data["total"] * 100) if data["total"] > 0 else 0
            print(f"  {source}: {data['with_embedding']}/{data['total']} ({pct:.1f}%)")
        return

    # Generate embeddings
    print("\n" + "=" * 50)
    print("Generating embeddings...")
    print("=" * 50)

    if args.source:
        print(f"Source: {args.source}")
    else:
        print("Source: all")
    print(f"Batch size: {args.batch_size}")
    print()

    try:
        total = generator.generate_all(args.source, args.batch_size)
        print(f"\n✓ Generated embeddings for {total} icons")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

    # Show final stats
    print("\nFinal Statistics:")
    stats = generator.get_embedding_stats()
    for source, data in stats.items():
        pct = (data["with_embedding"] / data["total"] * 100) if data["total"] > 0 else 0
        print(f"  {source}: {data['with_embedding']}/{data['total']} ({pct:.1f}%)")


if __name__ == "__main__":
    main()
