import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple header + rows", () => {
    const text = "party_name,passcode,first_name,last_name\nSmith,SM1,John,Smith\n";
    expect(parseCsv(text)).toEqual([
      ["party_name", "passcode", "first_name", "last_name"],
      ["Smith", "SM1", "John", "Smith"],
    ]);
  });

  it("handles a missing trailing newline", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("unquotes fields and honors commas/quotes inside quoted fields", () => {
    const text = 'name,note\n"Doe, Jane","Says ""hi"""\n';
    expect(parseCsv(text)).toEqual([
      ["name", "note"],
      ["Doe, Jane", 'Says "hi"'],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});
