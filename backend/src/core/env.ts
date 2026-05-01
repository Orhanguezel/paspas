// src/core/env.ts
import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

// Yükleme sırası (sonra gelen önceki değerleri override eder):
//   1. .env                    — base config
//   2. .env.local              — geliştiricinin lokal override'ları (gitignored)
//   3. .env.test (NODE_ENV=test ise) — test runner için izole DB / config
//
// Bu sıra, `bun test` veya `NODE_ENV=test ...` ile çalıştırılan testleri canlı
// veritabanından izole etmek için kullanılır. .env.test sadece test'te yüklenir.
dotenv.config();
const localEnv = resolve(process.cwd(), ".env.local");
if (existsSync(localEnv)) dotenv.config({ path: localEnv, override: true });

if (process.env.NODE_ENV === "test") {
  const testEnv = resolve(process.cwd(), ".env.test");
  if (existsSync(testEnv)) dotenv.config({ path: testEnv, override: true });
}

const toInt = (v: string | undefined, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
};
const toBool = (v: string | undefined, d = false) => {
  if (v == null) return d;
  const s = v.toLowerCase();
  return ["1", "true", "yes", "on"].includes(s);
};
const toList = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const CORS_LIST = toList(process.env.CORS_ORIGIN);
const CORS_ORIGIN = CORS_LIST.length ? CORS_LIST : [FRONTEND_URL];

// STORAGE_DRIVER normalleştirme
const RAW_STORAGE_DRIVER = (process.env.STORAGE_DRIVER || 'cloudinary').toLowerCase();
const STORAGE_DRIVER = (RAW_STORAGE_DRIVER === 'local' ? 'local' : 'cloudinary') as
  | 'local'
  | 'cloudinary';


export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: toInt(process.env.PORT, 8083),

 
  // Storage driver seçimi
  STORAGE_DRIVER,

  // Local storage (STORAGE_DRIVER=local iken aktif)
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT || '',
  LOCAL_STORAGE_BASE_URL: process.env.LOCAL_STORAGE_BASE_URL || '/uploads',

  // Örnek başka config (quiz)
  QUIZ: {
    DURATION_SECONDS: Number(process.env.QUIZ_DURATION_SECONDS ?? 60),
  },

  // Cloudinary ana alanlar (geriye dönük kullanım için düz alanlar)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UNSIGNED_PRESET: process.env.CLOUDINARY_UNSIGNED_PRESET || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || '',
  CLOUDINARY_BASE_PUBLIC: process.env.CLOUDINARY_BASE_PUBLIC || '',
  STORAGE_CDN_PUBLIC_BASE: process.env.STORAGE_CDN_PUBLIC_BASE || '',
  STORAGE_PUBLIC_API_BASE: process.env.STORAGE_PUBLIC_API_BASE || '',
  DB: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "app",
    password: process.env.DB_PASSWORD || "app",
    name: process.env.DB_NAME || "app",
  },

  JWT_SECRET: process.env.JWT_SECRET || "change-me",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "cookie-secret",

  CORS_ORIGIN,

  // ✅ Storage controller'ın kullandığı alanları ekliyoruz
  CDN_PUBLIC_BASE: process.env.CDN_PUBLIC_BASE || "", // ör: https://cdn.example.com
  PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || "", // ör: https://api.example.com

  // Cloudinary detayları (bazı yerler nested kullanıyorsa)
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'uploads',
    basePublic: process.env.CLOUDINARY_BASE_PUBLIC || '',
    publicStorageBase: process.env.PUBLIC_STORAGE_BASE || '',
  },

  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },

  // Geriye dönük
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",

  PUBLIC_URL: process.env.PUBLIC_URL || "http://localhost:8083",
  FRONTEND_URL: FRONTEND_URL,

  // ✅ SMTP / Mail
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: toInt(process.env.SMTP_PORT, 465),
  SMTP_SECURE: toBool(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "",
} as const;

export type AppEnv = typeof env;
