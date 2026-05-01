import { getLlmRuntimeSettings, type LlmProvider } from "./settings";

export type ChatArgs = {
  provider?: LlmProvider;
  model?: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  images?: string[];
  jsonMode?: boolean;
  timeoutMs?: number;
};

export type ChatUsage = { input: number; output: number };

export type ChatResult = {
  content: string;
  model: string;
  provider: LlmProvider;
  usage?: ChatUsage;
};

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly provider?: LlmProvider,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

const DEFAULT_TIMEOUT_MS = 45_000;

function buildAnthropicImagePart(image: string) {
  const trimmed = image.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return { type: "image", source: { type: "url", url: trimmed } };
  }

  const dataUriMatch = trimmed.match(/^data:(image\/[\w.+-]+);base64,(.+)$/i);
  if (dataUriMatch) {
    return {
      type: "image",
      source: { type: "base64", media_type: dataUriMatch[1], data: dataUriMatch[2] },
    };
  }

  return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: trimmed } };
}

function buildOpenAiCompatibleContent(args: Required<Pick<ChatArgs, "user">> & Pick<ChatArgs, "images">) {
  if (!args.images?.length) return args.user;
  return [
    { type: "text", text: args.user },
    ...args.images.map((image) => ({
      type: "image_url",
      image_url: {
        url: image.startsWith("http") ? image : `data:image/jpeg;base64,${image.replace(/^data:image\/\w+;base64,/, "")}`,
      },
    })),
  ];
}

async function chatAnthropic(args: ChatArgs, apiKey: string, model: string): Promise<ChatResult> {
  if (!apiKey) throw new LlmError("ANTHROPIC_API_KEY missing", undefined, "anthropic");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: args.maxTokens,
      temperature: args.temperature,
      system: args.system,
      messages: [
        {
          role: "user",
          content: args.images?.length
            ? [...args.images.map((image) => buildAnthropicImagePart(image)), { type: "text", text: args.user }]
            : args.user,
        },
      ],
    }),
    signal: AbortSignal.timeout(args.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new LlmError(`anthropic_${res.status}: ${text.slice(0, 200)}`, res.status, "anthropic");
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    model?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const content = data.content?.find((item) => item.type === "text")?.text?.trim() || data.content?.[0]?.text?.trim() || "";

  return {
    content,
    model: data.model || model,
    provider: "anthropic",
    usage: {
      input: data.usage?.input_tokens ?? 0,
      output: data.usage?.output_tokens ?? 0,
    },
  };
}

async function chatOpenAiCompatible(
  args: ChatArgs,
  config: { apiKey: string; baseUrl: string; model: string; provider: "openai" | "groq" | "azure" },
): Promise<ChatResult> {
  if (!config.apiKey) throw new LlmError(`${config.provider.toUpperCase()}_API_KEY missing`, undefined, config.provider);

  const body: Record<string, unknown> = {
    model: config.model,
    temperature: args.temperature,
    max_tokens: args.maxTokens,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: buildOpenAiCompatibleContent({ user: args.user, images: args.images }) },
    ],
  };

  if (args.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(args.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new LlmError(`${config.provider}_${res.status}: ${text.slice(0, 200)}`, res.status, config.provider);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content?.trim() || "",
    model: data.model || config.model,
    provider: config.provider,
    usage: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
  };
}

export async function chat(args: ChatArgs): Promise<ChatResult> {
  const settings = await getLlmRuntimeSettings();
  const provider = args.provider ?? settings.defaultProvider;
  const model = args.model ?? settings.defaultModel;
  const normalizedArgs: ChatArgs = {
    ...args,
    maxTokens: args.maxTokens ?? settings.maxTokens,
    temperature: args.temperature ?? settings.temperature,
  };

  switch (provider) {
    case "anthropic":
      return chatAnthropic(normalizedArgs, settings.anthropicApiKey, model);
    case "openai":
    case "azure":
      return chatOpenAiCompatible(normalizedArgs, {
        apiKey: settings.openaiApiKey,
        baseUrl: settings.openaiApiBase,
        model,
        provider,
      });
    case "groq":
      return chatOpenAiCompatible(normalizedArgs, {
        apiKey: settings.groqApiKey,
        baseUrl: settings.groqApiBase,
        model,
        provider: "groq",
      });
    case "local":
      throw new LlmError("local provider not implemented", undefined, "local");
    default:
      throw new LlmError(`unknown provider: ${provider}`);
  }
}
