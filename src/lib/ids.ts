import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const newId = customAlphabet(alphabet, 16);
export const newToken = customAlphabet(alphabet, 40);
