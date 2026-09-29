import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_UPLOAD, validateImages } from "./validateImages";

function makeFile(name: string, type: string, sizeBytes = 100): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function errorFor(entries: unknown[]) {
  const result = validateImages(entries);
  return result.ok ? undefined : result.error;
}

describe("validateImages", () => {
  it("accepts JPG, PNG, WebP and GIF images", () => {
    const files = [
      makeFile("a.jpg", "image/jpeg"),
      makeFile("b.png", "image/png"),
      makeFile("c.webp", "image/webp"),
      makeFile("d.gif", "image/gif"),
    ];

    expect(validateImages(files)).toEqual({ ok: true, value: files });
  });

  it("requires at least one image", () => {
    expect(errorFor([])).toBe("Välj minst en bild");
  });

  it("accepts the maximum number of images", () => {
    const files = Array.from({ length: MAX_IMAGES_PER_UPLOAD }, (_, i) => makeFile(`${i}.png`, "image/png"));

    expect(errorFor(files)).toBeUndefined();
  });

  it("rejects more than the maximum number of images", () => {
    const files = Array.from({ length: MAX_IMAGES_PER_UPLOAD + 1 }, (_, i) => makeFile(`${i}.png`, "image/png"));

    expect(errorFor(files)).toBe(`Högst ${MAX_IMAGES_PER_UPLOAD} bilder åt gången`);
  });

  it("rejects form fields that are text instead of files", () => {
    expect(errorFor(["not a file"])).toBe("images måste vara filer");
  });

  it("rejects file types that are not supported images", () => {
    expect(errorFor([makeFile("ritning.pdf", "application/pdf")])).toBe(
      "ritning.pdf är inte en bild som stöds (JPG, PNG, WebP eller GIF)",
    );
  });

  it("rejects an empty file", () => {
    expect(errorFor([makeFile("tom.png", "image/png", 0)])).toBe("tom.png är tom");
  });

  it("accepts an image of exactly the maximum size", () => {
    expect(errorFor([makeFile("stor.jpg", "image/jpeg", MAX_IMAGE_BYTES)])).toBeUndefined();
  });

  it("rejects an image larger than the maximum size", () => {
    expect(errorFor([makeFile("stor.jpg", "image/jpeg", MAX_IMAGE_BYTES + 1)])).toBe("stor.jpg är större än 10 MB");
  });
});
