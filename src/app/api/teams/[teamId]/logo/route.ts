import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * POST /api/teams/[teamId]/logo — Upload team logo
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verify owner/admin role
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return NextResponse.json(
      { error: "Only team owners and admins can upload a logo" },
      { status: 403 }
    );
  }

  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File must be JPEG, PNG, WebP, or GIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be under 2MB" },
      { status: 400 }
    );
  }

  const ext = EXT_MAP[file.type] ?? "png";
  const filePath = `${teamId}/logo.${ext}`;

  // Remove any existing logo files (handles format changes, e.g. PNG → JPG)
  const { data: existingFiles } = await admin.storage
    .from("team-logos")
    .list(teamId);

  if (existingFiles && existingFiles.length > 0) {
    const paths = existingFiles.map((f) => `${teamId}/${f.name}`);
    await admin.storage.from("team-logos").remove(paths);
  }

  // Upload to storage
  const { error: uploadError } = await admin.storage
    .from("team-logos")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }

  // Get the public URL
  const { data: urlData } = admin.storage
    .from("team-logos")
    .getPublicUrl(filePath);

  // Add cache-busting param so browsers pick up new logos
  const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Update teams table
  const { error: updateError } = await admin
    .from("teams")
    .update({ logo_url: logoUrl })
    .eq("id", teamId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update team logo" },
      { status: 500 }
    );
  }

  return NextResponse.json({ logo_url: logoUrl });
}

/**
 * DELETE /api/teams/[teamId]/logo — Remove team logo
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verify owner/admin role
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return NextResponse.json(
      { error: "Only team owners and admins can remove the logo" },
      { status: 403 }
    );
  }

  // List and remove all files in the team's logo folder
  const { data: files } = await admin.storage
    .from("team-logos")
    .list(teamId);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${teamId}/${f.name}`);
    await admin.storage.from("team-logos").remove(paths);
  }

  // Clear logo_url in teams table
  const { error: updateError } = await admin
    .from("teams")
    .update({ logo_url: null })
    .eq("id", teamId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to remove team logo" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
