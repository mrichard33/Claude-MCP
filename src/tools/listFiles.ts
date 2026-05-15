import { listFilesSchema } from '../schemas.js';
import { getOctokit, getOwner, getRepo, getDefaultBranch } from '../github.js';

export const listFilesTool = {
  name: 'dashboard_list_files',
  description:
    'List files and directories at a path in the reece-dashboard repo (antifragile-mission-control). Pass empty path for repo root. Returns an array of {name, type, path, size}.',
  inputSchema: listFilesSchema,
  handler: async (args: Record<string, unknown>) => {
    const parsed = listFilesSchema.parse(args);
    const oct = getOctokit();
    const ref = parsed.branch ?? (await getDefaultBranch());
    const { data } = await oct.repos.getContent({
      owner: getOwner(),
      repo: getRepo(),
      path: parsed.path,
      ref,
    });
    if (!Array.isArray(data)) {
      return [
        {
          name: data.name,
          type: data.type,
          path: data.path,
          size: data.size,
        },
      ];
    }
    return data.map((item) => ({
      name: item.name,
      type: item.type,
      path: item.path,
      size: item.size,
    }));
  },
};
