export interface LLMGenerateInput {
  rawNotes: string;
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LLMGenerateOutput {
  spec: string;
  usage: LLMUsage;
  model: string;
}

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  generate(input: LLMGenerateInput): Promise<LLMGenerateOutput>;
}
