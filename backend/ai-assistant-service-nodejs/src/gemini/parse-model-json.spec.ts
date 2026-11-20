import { parseModelJson } from './gemini.service';

describe('parseModelJson', () => {
  it('parses a bare JSON object (JSON mode)', () => {
    expect(parseModelJson('{"possible": true, "confidence": 0.9}')).toEqual({ possible: true, confidence: 0.9 });
  });

  it('parses JSON inside a markdown fence', () => {
    expect(parseModelJson('Here you go:\n```json\n{"a": 1}\n```\nThanks')).toEqual({ a: 1 });
  });

  it('parses an object surrounded by prose', () => {
    expect(parseModelJson('Result: {"a": {"b": 2}} done.')).toEqual({ a: { b: 2 } });
  });

  it('returns null for invalid or non-object JSON', () => {
    expect(parseModelJson('not json')).toBeNull();
    expect(parseModelJson('[1, 2, 3]')).toBeNull();
    expect(parseModelJson('{"a": 1} and {"b": 2}')).toBeNull();
  });
});
