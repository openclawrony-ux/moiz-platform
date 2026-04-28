export interface LLMGenerateInput {
  rawNotes: string;
}

export interface LLMGenerateOutput {
  spec: string;
}

export interface LLMProvider {
  readonly name: string;
  generate(input: LLMGenerateInput): Promise<LLMGenerateOutput>;
}
