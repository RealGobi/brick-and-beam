import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteImageFiles, saveImageFile } from "./imageStorage";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "image-storage-test-"));
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("saveImageFile", () => {
  it("writes the file contents to the folder", async () => {
    const file = new File(["image bytes"], "kakel.png", { type: "image/png" });

    const saved = await saveImageFile(file, dir);

    expect(await fs.readFile(path.join(dir, saved.fileName), "utf8")).toBe("image bytes");
  });

  it("uses a random name with an extension based on the type, not the original name", async () => {
    const file = new File(["x"], "../../evil.exe", { type: "image/jpeg" });

    const saved = await saveImageFile(file, dir);

    expect(saved.fileName).toMatch(/^[0-9a-f-]{36}\.jpg$/);
  });

  it("gives two uploads of the same file different names", async () => {
    const file = new File(["x"], "kakel.png", { type: "image/png" });

    const first = await saveImageFile(file, dir);
    const second = await saveImageFile(file, dir);

    expect(first.fileName).not.toBe(second.fileName);
  });

  it("returns the details to store in the database", async () => {
    const file = new File(["12345"], "kakel.png", { type: "image/png" });

    const saved = await saveImageFile(file, dir);

    expect(saved).toEqual({ fileName: saved.fileName, originalName: "kakel.png", contentType: "image/png", sizeBytes: 5 });
  });

  it("creates the folder if it does not exist", async () => {
    const nestedDir = path.join(dir, "new", "folder");

    const saved = await saveImageFile(new File(["x"], "a.png", { type: "image/png" }), nestedDir);

    await expect(fs.access(path.join(nestedDir, saved.fileName))).resolves.toBeUndefined();
  });
});

describe("deleteImageFiles", () => {
  it("removes the given files", async () => {
    const saved = await saveImageFile(new File(["x"], "a.png", { type: "image/png" }), dir);

    await deleteImageFiles([saved.fileName], dir);

    expect(await fs.readdir(dir)).toEqual([]);
  });

  it("ignores files that are already gone", async () => {
    await expect(deleteImageFiles(["missing.png"], dir)).resolves.toBeUndefined();
  });
});
