import { describe, it, expect, mock } from "bun:test";

// Mock apiClient
const mockPost = mock(() => Promise.resolve({ data: { success: true, data: { form_type: "batch", suggestion: { jenis_ikan: "tongkol" } } } }));
mock.module("../lib/api-client", () => ({
  default: {
    post: mockPost,
  },
}));

import { voiceApi } from "../services/api";

describe("voiceApi.parse", () => {
  it("should call POST /voice/parse with transcript and formType, then unwrap response", async () => {
    const transcript = "Jual tongkol 5 kilo";
    const result = await voiceApi.parse(transcript, "batch");

    expect(mockPost).toHaveBeenCalledWith("/voice/parse", {
      transcript,
      form_type: "batch",
    });
    expect(result.form_type).toBe("batch");
    expect(result.suggestion.jenis_ikan).toBe("tongkol");
  });
});
