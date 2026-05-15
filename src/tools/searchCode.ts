import { searchCodeSchema } from '../schemas.js';
import { getOctokit, getOwner, getRepo } from '../github.js';

type TextMatch = { fragment?: string; property?: string };

export const searchCodeTool = {
  name: 'dashboard_search_code',
  description:
    'Full-text search the reece-dashboard repo via GitHub code search. NOTE: GitHub indexing lags, so files pushed in the last few minutes may not appear yet — if you know the path, fall back to dashboard_get_file.',
  inputSchema: searchCodeSchema,
  handler: async (args: Record<string, unknown>) => {
    const parsed = searchCodeSchema.parse(args);
    const owner = getOwner();
    const repo = getRepo();
    let q = `${parsed.query} repo:${owner}/${repo}`;
    if (parsed.path) q += ` path:${parsed.path}`;
    const oct = getOctokit();
    const { data } = await oct.search.code({
      q,
      per_page: 30,
      headers: { accept: 'application/vnd.github.text-match+json' },
    });
    return data.items.map((item) => {
      const matches: TextMatch[] = (item as unknown as { text_matches?: TextMatch[] }).text_matches ?? [];
      return {
        path: item.path,
        url: item.html_url,
        score: item.score,
        matches: matches.map((m) => ({ fragment: m.fragment, property: m.property })),
      };
    });
  },
};
