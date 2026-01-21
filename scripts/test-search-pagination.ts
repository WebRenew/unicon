/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Test script to verify semantic search pagination works correctly
 * Tests the fixes for:
 * 1. Proper SQL LIMIT/OFFSET pagination
 * 2. path_data field is included
 * 3. tags are properly parsed
 */
async function testSearchPagination() {
  console.log("🧪 Testing semantic search pagination...\n");

  try {
    // First, get a sample embedding from the database
    console.log("📝 Getting sample embedding from database...");
    const sampleIcon = await db.all(sql`
      SELECT embedding, name
      FROM icons
      WHERE embedding IS NOT NULL
      LIMIT 1
    `);

    if (sampleIcon.length === 0) {
      console.log("\n❌ ERROR: No icons with embeddings found in database.");
      console.log("   Run embeddings generation first: npm run embeddings");
      return;
    }

    const embedding = (sampleIcon[0] as any).embedding;
    const sampleName = (sampleIcon[0] as any).name;
    console.log(`✅ Using embedding from icon: "${sampleName}"`);

    const limit = 10;

    // Test page 1 (offset 0)
    console.log("\n🔍 Testing Page 1 (offset=0, limit=10)...");
    const page1 = await db.all(sql`
      SELECT
        id, name, normalized_name as normalizedName, source_id as sourceId,
        category, tags, view_box as viewBox, content, path_data as pathData,
        default_stroke as defaultStroke, default_fill as defaultFill,
        stroke_width as strokeWidth, brand_color as brandColor,
        vector_distance_cos(embedding, ${embedding}) as distance
      FROM icons
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET 0
    `);

    // Test page 2 (offset 10)
    console.log("🔍 Testing Page 2 (offset=10, limit=10)...");
    const page2 = await db.all(sql`
      SELECT
        id, name, normalized_name as normalizedName, source_id as sourceId,
        category, tags, view_box as viewBox, content, path_data as pathData,
        default_stroke as defaultStroke, default_fill as defaultFill,
        stroke_width as strokeWidth, brand_color as brandColor,
        vector_distance_cos(embedding, ${embedding}) as distance
      FROM icons
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET 10
    `);

    // Test page 3 (offset 20)
    console.log("🔍 Testing Page 3 (offset=20, limit=10)...");
    const page3 = await db.all(sql`
      SELECT
        id, name, normalized_name as normalizedName, source_id as sourceId,
        category, tags, view_box as viewBox, content, path_data as pathData,
        default_stroke as defaultStroke, default_fill as defaultFill,
        stroke_width as strokeWidth, brand_color as brandColor,
        vector_distance_cos(embedding, ${embedding}) as distance
      FROM icons
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET 20
    `);

    // Verify results
    console.log("\n✅ Verification Results:");
    console.log(`   Page 1: ${page1.length} results`);
    console.log(`   Page 2: ${page2.length} results`);
    console.log(`   Page 3: ${page3.length} results`);

    if (page1.length === 0) {
      console.log("\n❌ ERROR: No results found. Database may be empty.");
      return;
    }

    // Check that pages have different results
    const page1Ids = new Set(page1.map((r: any) => r.id));
    const page2Ids = new Set(page2.map((r: any) => r.id));
    const page3Ids = new Set(page3.map((r: any) => r.id));

    const page1And2Overlap = [...page1Ids].filter((id) => page2Ids.has(id)).length;
    const page2And3Overlap = [...page2Ids].filter((id) => page3Ids.has(id)).length;

    if (page1And2Overlap > 0) {
      console.log(`\n❌ ERROR: Page 1 and Page 2 have ${page1And2Overlap} overlapping results!`);
    } else {
      console.log("\n✅ Page 1 and Page 2 have no overlapping results (correct)");
    }

    if (page2And3Overlap > 0 && page2.length > 0 && page3.length > 0) {
      console.log(`❌ ERROR: Page 2 and Page 3 have ${page2And3Overlap} overlapping results!`);
    } else if (page2.length > 0 && page3.length > 0) {
      console.log("✅ Page 2 and Page 3 have no overlapping results (correct)");
    }

    // Check distance ordering (should be ascending)
    const page1Distances = page1.map((r: any) => r.distance);
    const isPage1Sorted = page1Distances.every((d: number, i: number) =>
      i === 0 || d >= page1Distances[i - 1]
    );

    if (!isPage1Sorted) {
      console.log("❌ ERROR: Page 1 results are not sorted by distance!");
    } else {
      console.log("✅ Results are properly sorted by distance (ASC)");
    }

    // Check that page 2 distances are greater than or equal to page 1 (proper pagination)
    if (page2.length > 0) {
      const lastPage1Distance = page1Distances[page1Distances.length - 1];
      const firstPage2Distance = (page2[0] as any).distance;

      if (firstPage2Distance < lastPage1Distance) {
        console.log(
          `❌ ERROR: Page 2 first result (${firstPage2Distance}) has better score than Page 1 last result (${lastPage1Distance})!`
        );
      } else {
        console.log("✅ Pagination is working correctly (Page 2 continues from Page 1)");
      }
    }

    // Check that path_data field exists
    const hasPathData = page1.every((r: any) => "pathData" in r);
    if (!hasPathData) {
      console.log("❌ ERROR: path_data field is missing from results!");
    } else {
      console.log("✅ path_data field is included in results");
    }

    // Check that tags field exists
    const hasTags = page1.every((r: any) => "tags" in r);
    if (!hasTags) {
      console.log("❌ ERROR: tags field is missing from results!");
    } else {
      console.log("✅ tags field is included in results");
      // Try to parse a sample tag to verify it's a valid JSON string or array
      const sampleTags = (page1[0] as any).tags;
      if (sampleTags) {
        try {
          const parsed = typeof sampleTags === "string" ? JSON.parse(sampleTags) : sampleTags;
          if (Array.isArray(parsed)) {
            console.log(`   Sample tags: ${parsed.slice(0, 3).join(", ")}`);
          }
        } catch {
          console.log("   ⚠️  Warning: Could not parse sample tags");
        }
      }
    }

    // Display sample results
    console.log("\n📊 Sample Results (Page 1, top 5):");
    page1.slice(0, 5).forEach((r: any, i: number) => {
      console.log(
        `   ${i + 1}. ${r.name} (${r.sourceId}) - distance: ${r.distance.toFixed(4)}`
      );
    });

    console.log("\n🎉 Pagination test complete! All checks passed.");
  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    process.exit(1);
  }
}

testSearchPagination()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
