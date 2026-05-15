import { createBranchSchema } from '../schemas.js';
import { getOctokit, getOwner, getRepo } from '../github.js';

export const createBranchTool = {
  name: 'dashboard_create_branch',
  description:
    'Create a new branch in the reece-dashboard repo from an existing branch. Defaults to branching from `dev`.',
  inputSchema: createBranchSchema,
  handler: async (args: Record<string, unknown>) => {
    const parsed = createBranchSchema.parse(args);
    const oct = getOctokit();
    const { data: ref } = await oct.git.getRef({
      owner: getOwner(),
      repo: getRepo(),
      ref: `heads/${parsed.from_branch}`,
    });
    const sha = ref.object.sha;
    await oct.git.createRef({
      owner: getOwner(),
      repo: getRepo(),
      ref: `refs/heads/${parsed.branch}`,
      sha,
    });
    return { branch: parsed.branch, sha, from_branch: parsed.from_branch };
  },
};
