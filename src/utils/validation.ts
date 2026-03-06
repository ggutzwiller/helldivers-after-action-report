import { Attachment } from "discord.js";
import type { Language } from "../types.js";
import { t } from "./locale.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImage(
  attachment: Attachment,
  lang: Language
): { valid: true } | { valid: false; reason: string } {
  if (!attachment.contentType || !ALLOWED_TYPES.includes(attachment.contentType)) {
    return { valid: false, reason: t(lang).errorInvalidFormat };
  }

  if (attachment.size > MAX_SIZE_BYTES) {
    const sizeMb = (attachment.size / 1024 / 1024).toFixed(1);
    return { valid: false, reason: t(lang).errorImageTooLarge(sizeMb) };
  }

  return { valid: true };
}
