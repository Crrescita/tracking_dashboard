import * as crypto from "crypto";

const algorithm = "aes-256-cbc";
const key = Buffer.from("YOUR_KEY_HERE", "hex"); // Replace with your actual key
const iv = Buffer.from("YOUR_IV_HERE", "hex"); // Replace with your actual IV

export const decrypt = (text: string): string => {
  let textParts = text.split(":");
  let iv = Buffer.from(textParts.shift(), "hex");
  let encryptedText = Buffer.from(textParts.join(":"), "hex");
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
