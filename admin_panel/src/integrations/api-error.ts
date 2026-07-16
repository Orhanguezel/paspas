type ApiErrorShape = {
  data?: {
    error?: {
      code?: string;
      detail?: string;
      message?: string;
    };
  };
};

const ERROR_MESSAGES: Record<string, string> = {
  kuyruk_kaydi_bulunamadi: "Kuyruk kaydı bulunamadı — sayfayı yenileyin.",
  kuyruk_makine_uyumsuz: "Kuyruk kaydı seçilen makineyle eşleşmiyor — sayfayı yenileyin.",
};

export function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("data" in error)) return undefined;

  const apiError = (error as ApiErrorShape).data?.error;
  if (!apiError) return undefined;

  const key = apiError.code ?? apiError.message;
  if (key && ERROR_MESSAGES[key]) return ERROR_MESSAGES[key];
  return apiError.detail ?? apiError.message;
}
