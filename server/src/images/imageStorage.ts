import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { NewStepImage } from "../steps/stepStore";
import { imageExtensions } from "./validateImages";

/** Folder for uploaded images. Override with UPLOADS_DIR, e.g. on a server with a separate data disk. */
export const uploadsDir = process.env.UPLOADS_DIR ?? path.join(__dirname, "../../uploads");

const MAX_ORIGINAL_NAME_LENGTH = 255;

/**
 * Saves a validated image under a random file name, so uploads can never overwrite
 * each other or escape the uploads folder.
 */
export async function saveImageFile(file: File, dir = uploadsDir): Promise<NewStepImage> {
  const fileName = `${randomUUID()}${imageExtensions[file.type]}`;

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));

  return {
    fileName,
    originalName: file.name.slice(0, MAX_ORIGINAL_NAME_LENGTH),
    contentType: file.type,
    sizeBytes: file.size,
  };
}

/** Removes saved files, e.g. when the database insert for them failed. Missing files are ignored. */
export async function deleteImageFiles(fileNames: string[], dir = uploadsDir): Promise<void> {
  await Promise.all(fileNames.map((fileName) => fs.rm(path.join(dir, fileName), { force: true })));
}
