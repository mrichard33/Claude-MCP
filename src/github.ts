import { Octokit } from '@octokit/rest';

let cached: Octokit | null = null;
let cachedDefaultBranch: string | null = null;

export function getOctokit(): Octokit {
  if (cached) return cached;
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    throw new Error('GITHUB_PAT not configured');
  }
  cached = new Octokit({
    auth: pat,
    userAgent: 'dashboard-mcp/1.0.0',
  });
  return cached;
}

export function getOwner(): string {
  const v = process.env.GITHUB_OWNER;
  if (!v) throw new Error('GITHUB_OWNER not configured');
  return v;
}

export function getRepo(): string {
  const v = process.env.GITHUB_REPO;
  if (!v) throw new Error('GITHUB_REPO not configured');
  return v;
}

export async function getDefaultBranch(): Promise<string> {
  if (cachedDefaultBranch) return cachedDefaultBranch;
  const oct = getOctokit();
  const { data } = await oct.repos.get({ owner: getOwner(), repo: getRepo() });
  cachedDefaultBranch = data.default_branch;
  return cachedDefaultBranch;
}
