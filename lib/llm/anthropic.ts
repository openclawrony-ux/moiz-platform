import Anthropic from "@anthropic-ai/sdk";
import type {
  LLMGenerateInput,
  LLMGenerateOutput,
  LLMProvider,
} from "./provider";

export interface AnthropicProviderOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTokens?: number;
}

const DEFAULT_MAX_TOKENS = 1500;

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  readonly model: string;

  private readonly client: Anthropic;
  private readonly systemPrompt: string;
  private readonly maxTokens: number;

  constructor(options: AnthropicProviderOptions) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model;
    this.systemPrompt = options.systemPrompt;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  async generate(input: LLMGenerateInput): Promise<LLMGenerateOutput> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: this.systemPrompt,
      messages: [{ role: "user", content: input.rawNotes }],
    });

    const spec = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return {
      spec,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens ?? 0,
        outputTokens: response.usage.output_tokens ?? 0,
      },
    };
  }
}

export interface BuildAnthropicProviderOptions {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  maxTokens?: number;
}

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export function buildAnthropicProvider(
  options: BuildAnthropicProviderOptions,
): AnthropicProvider {
  return new AnthropicProvider({
    apiKey: options.apiKey,
    model: options.model ?? DEFAULT_MODEL,
    systemPrompt: options.systemPrompt,
    maxTokens: options.maxTokens,
  });
}
