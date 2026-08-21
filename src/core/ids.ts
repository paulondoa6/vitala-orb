import { customAlphabet, nanoid } from "nanoid";

/** Crockford-style alphabet: no visually ambiguous characters. */
const PUBLIC_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const publicId = customAlphabet(PUBLIC_ALPHABET, 6);

export const createPublicCode = () => publicId();
export const createId = () => nanoid(12);

const PUBLIC_CODE_RE = new RegExp(`^[${PUBLIC_ALPHABET}]{6}$`);
export const isPublicCode = (value: string) => PUBLIC_CODE_RE.test(value);
