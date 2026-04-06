import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname, extname } from "path";
import * as XLSX from "xlsx";

/**
 * Seed players from an Excel file (.xlsx).
 *
 * Expected columns: Name, Email, Headshot Filename
 * Names in "Last, First" format are converted to "First Last".
 * Headshot paths are relative to the Excel file location.
 *
 * Usage:
 *   bun --env-file=.env.local scripts/seed-players.ts path/to/players.xlsx
 */

interface PlayerRow {
  name: string;
  email: string;
  headshot: string;
}

function parseExcel(filePath: string): PlayerRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  if (rows.length === 0) {
    console.error("No data rows found in spreadsheet");
    process.exit(1);
  }

  // Find columns by matching header names (case-insensitive, partial match)
  const firstRow = rows[0];
  const headers = Object.keys(firstRow);

  const nameCol = headers.find((h) => h.toLowerCase().includes("name"));
  const emailCol = headers.find((h) => h.toLowerCase().includes("email"));
  const headshotCol = headers.find((h) => h.toLowerCase().includes("headshot") || h.toLowerCase().includes("image"));

  if (!nameCol || !emailCol || !headshotCol) {
    console.error(`Could not find required columns. Found: ${headers.join(", ")}`);
    console.error("Need columns containing: name, email, headshot/image");
    process.exit(1);
  }

  console.log(`Mapped columns: "${nameCol}" → name, "${emailCol}" → email, "${headshotCol}" → headshot\n`);

  return rows.map((row) => ({
    name: String(row[nameCol] || "").trim(),
    email: String(row[emailCol] || "").trim(),
    headshot: String(row[headshotCol] || "").trim(),
  })).filter((r) => r.name && r.email && r.headshot);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    console.error("Run with: bun --env-file=.env.local scripts/seed-players.ts players.xlsx");
    process.exit(1);
  }

  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: bun --env-file=.env.local scripts/seed-players.ts <path-to-xlsx>");
    process.exit(1);
  }

  const resolvedPath = resolve(filePath);
  if (!existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const fileDir = dirname(resolvedPath);
  const players = parseExcel(resolvedPath);
  const supabase = createClient(url, key);

  console.log(`Found ${players.length} players\n`);

  let succeeded = 0;
  let failed = 0;

  for (const player of players) {
    const email = player.email.toLowerCase();

    // Convert "Last, First" to "First Last"
    const fullName = player.name.includes(",")
      ? player.name.split(",").map((s) => s.trim()).reverse().join(" ")
      : player.name;

    const label = `${fullName} (${email})`;

    // Resolve image path relative to the Excel file
    const imagePath = resolve(fileDir, player.headshot);
    if (!existsSync(imagePath)) {
      console.error(`  ✗ ${label} — image not found: ${imagePath}`);
      failed++;
      continue;
    }

    // Upload headshot to Supabase Storage
    const ext = extname(imagePath).toLowerCase();
    const storagePath = `${email.replace(/[@.]/g, "_")}${ext}`;
    const fileBuffer = readFileSync(imagePath);

    const contentType =
      ext === ".png" ? "image/png" :
      ext === ".webp" ? "image/webp" :
      "image/jpeg";

    const { error: uploadError } = await supabase.storage
      .from("headshots")
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`  ✗ ${label} — upload failed: ${uploadError.message}`);
      failed++;
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("headshots")
      .getPublicUrl(storagePath);

    // Upsert into player_seeds
    const { error: dbError } = await supabase
      .from("player_seeds")
      .upsert(
        {
          email,
          full_name: fullName,
          photo_url: urlData.publicUrl,
        },
        { onConflict: "email" }
      );

    if (dbError) {
      console.error(`  ✗ ${label} — db insert failed: ${dbError.message}`);
      failed++;
      continue;
    }

    console.log(`  ✓ ${label}`);
    succeeded++;
  }

  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed`);
}

main();
