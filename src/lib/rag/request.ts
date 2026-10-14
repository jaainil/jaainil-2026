/** Bound actual bytes, including chunked bodies and dishonest Content-Length headers. */
export async function readChatBody(request: Request): Promise<unknown> {
  const maxBytes = 32 * 1024;
  if (Number(request.headers.get('content-length')) > maxBytes) {
    throw new ChatBodyTooLarge();
  }
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new ChatBodyTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    return null;
  }
}

export class ChatBodyTooLarge extends Error {
  constructor() { super('Request body too large (32 KiB max).'); }
}
