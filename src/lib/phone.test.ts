import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("allows a blank value", () => {
    expect(normalizePhone("")).toEqual({ ok: true, value: null });
    expect(normalizePhone("   ")).toEqual({ ok: true, value: null });
    expect(normalizePhone(undefined)).toEqual({ ok: true, value: null });
  });

  it("normalizes a dashed 10-digit number", () => {
    expect(normalizePhone("402-555-1234")).toEqual({
      ok: true,
      value: "+14025551234",
    });
  });

  it("normalizes a parenthesized number", () => {
    expect(normalizePhone("(402) 555-1234")).toEqual({
      ok: true,
      value: "+14025551234",
    });
  });

  it("normalizes a number with a leading +1 and spaces", () => {
    expect(normalizePhone("+1 402 555 1234")).toEqual({
      ok: true,
      value: "+14025551234",
    });
  });

  it("normalizes an 11-digit number starting with 1", () => {
    expect(normalizePhone("14025551234")).toEqual({
      ok: true,
      value: "+14025551234",
    });
  });

  it("rejects a too-short number", () => {
    const result = normalizePhone("123");
    expect(result.ok).toBe(false);
  });

  it("rejects a too-long number", () => {
    const result = normalizePhone("240255512345");
    expect(result.ok).toBe(false);
  });

  it("rejects a non-US-looking 11-digit number", () => {
    const result = normalizePhone("24025551234");
    expect(result.ok).toBe(false);
  });

  it("rejects letters", () => {
    const result = normalizePhone("call-me-maybe");
    expect(result.ok).toBe(false);
  });
});

describe("formatPhone", () => {
  it("formats an E.164 number for display", () => {
    expect(formatPhone("+14025551234")).toBe("(402) 555-1234");
  });

  it("returns an empty string for null", () => {
    expect(formatPhone(null)).toBe("");
  });

  it("falls back to the raw value for an unexpected shape", () => {
    expect(formatPhone("not-e164")).toBe("not-e164");
  });
});
