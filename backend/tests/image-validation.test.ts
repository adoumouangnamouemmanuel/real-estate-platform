import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { encodeImage } from "../src/modules/uploads/upload.service.js";

test("valid images are re-encoded while SVG and oversized input are rejected", async () => {
  const original = await sharp({
    create: { width: 4, height: 3, channels: 3, background: "#557755" },
  })
    .png()
    .toBuffer();
  const output = await encodeImage(original);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 4);
  assert.equal(metadata.height, 3);
  assert.equal(metadata.exif, undefined);
  await assert.rejects(() =>
    encodeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
  );
  await assert.rejects(() => encodeImage(Buffer.alloc(10 * 1024 * 1024 + 1)));
});
