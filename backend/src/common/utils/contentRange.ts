// ────────────────────────────────────────────────────────────────────────────────
// 7) src/common/utils/contentRange.ts
// ────────────────────────────────────────────────────────────────────────────────
export function setContentRange(reply: any, offset: number, limit: number, total: number) {
const end = Math.max(0, Math.min(total - 1, offset + limit - 1));
reply.header('Content-Range', `${offset}-${end}/${total}`);
}