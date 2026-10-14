/** Public, crawlable image URLs shared by covers, metadata, and RSS. */
export const articleImagePath = (id: string) => `/og/${encodeURIComponent(id)}.png`;
