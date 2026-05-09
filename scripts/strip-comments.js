export function stripComments(text) {
  return text.replace(/\{\s*comment\s*:\s*([^}]+)\}/gi, (_, content) => content.trim());
}
