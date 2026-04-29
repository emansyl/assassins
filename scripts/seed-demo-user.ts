import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, extname } from "path";

/**
 * Seed a single demo user (e.g., professor / reviewer).
 *
 * Creates an auth user and a `players` row marked `is_demo = true`,
 * `status = 'opted_out'`, with onboarding pre-completed so they can
 * log in and immediately see the demo dashboard with no friction.
 *
 * Usage:
 *   bun --env-file=.env.local scripts/seed-demo-user.ts <email> "<Full Name>" [path/to/photo.jpg]
 *
 * Examples:
 *   bun --env-file=.env.local scripts/seed-demo-user.ts professor@school.edu "Professor Smith"
 *   bun --env-file=.env.local scripts/seed-demo-user.ts professor@school.edu "Professor Smith" ./professor.jpg
 */

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    console.error(
      "Run with: bun --env-file=.env.local scripts/seed-demo-user.ts <email> <full name> [photo path]"
    );
    process.exit(1);
  }

  const emailArg = process.argv[2];
  const nameArg = process.argv[3];
  const photoArg = process.argv[4]; // optional

  if (!emailArg || !nameArg) {
    console.error(
      "Usage: bun --env-file=.env.local scripts/seed-demo-user.ts <email> \"<Full Name>\" [path/to/photo.jpg]"
    );
    console.error(
      "Example: bun --env-file=.env.local scripts/seed-demo-user.ts professor@school.edu \"Professor Smith\" ./photo.jpg"
    );
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  const fullName = nameArg.trim();

  const supabase = createClient(url, key);

  console.log(`Seeding demo user: ${fullName} (${email})\n`);

  // Optional: upload headshot
  let photoUrl: string | null = null;
  if (photoArg) {
    const imagePath = resolve(photoArg);
    if (!existsSync(imagePath)) {
      console.error(`✗ Photo not found: ${imagePath}`);
      process.exit(1);
    }

    const ext = extname(imagePath).toLowerCase();
    const storagePath = `${email.replace(/[@.]/g, "_")}${ext}`;
    const fileBuffer = readFileSync(imagePath);

    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";

    const { error: uploadError } = await supabase.storage
      .from("headshots")
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`✗ Photo upload failed: ${uploadError.message}`);
      process.exit(1);
    }

    // Store the same path format that other players use
    // (the app extracts /headshots/<filename> via regex when signing URLs)
    const { data: urlData } = supabase.storage
      .from("headshots")
      .getPublicUrl(storagePath);
    photoUrl = urlData.publicUrl;

    console.log(`  ✓ Photo uploaded to headshots/${storagePath}`);
  }

  const metadata: { full_name: string; photo_url?: string } = { full_name: fullName };
  if (photoUrl) metadata.photo_url = photoUrl;

  // Try to create auth user
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadata,
  });

  let userId: string | undefined = created?.user?.id;

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      // User already exists — find them
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users.find((u) => u.email?.toLowerCase() === email);
      if (!existing) {
        console.error(`✗ User exists but lookup failed`);
        process.exit(1);
      }
      userId = existing.id;
      // Refresh metadata
      await supabase.auth.admin.updateUserById(existing.id, { user_metadata: metadata });
      console.log(`  ↻ Auth user already existed — refreshed metadata`);
    } else {
      console.error(`✗ createUser failed: ${createError.message}`);
      process.exit(1);
    }
  } else {
    console.log(`  ✓ Auth user created`);
  }

  if (!userId) {
    console.error(`✗ Could not determine user id`);
    process.exit(1);
  }

  // Upsert players row with demo flags + pre-completed onboarding
  const playerRow = {
    id: userId,
    email,
    full_name: fullName,
    phone: "",
    photo_url: photoUrl,
    status: "opted_out",
    kill_count: 0,
    eliminated_at: null,
    eliminated_by: null,
    onboarding_complete: true,
    rules_accepted_at: new Date().toISOString(),
    spoon_collected: true,
    is_demo: true,
  };

  // Use upsert so re-running the script just refreshes the row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upsertError } = await (supabase.from("players") as any).upsert(playerRow, {
    onConflict: "id",
  });

  if (upsertError) {
    console.error(`✗ players upsert failed: ${upsertError.message}`);
    process.exit(1);
  }

  console.log(`  ✓ Players row marked is_demo=true, status=opted_out, onboarding_complete=true\n`);
  console.log(`Done. ${fullName} can now log in at the app and will see the demo experience.`);
  console.log(`Tell them to enter "${email}" on the login page and check their inbox for the OTP.`);
}

main();
