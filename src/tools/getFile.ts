import { getFileSchema } from '../schemas.js';
import { getOctokit, getOwner, getRepo, getDefaultBranch } from '../github.js';

const MAX_BYTES = 500_000;

export const getFileTool = {
  name: 'dashboard_get_file',
  description:
    'Get the full content of a file from the reece-dashboard repo plus its SHA. The SHA is required when calling dashboard_create_or_update_file to update this file. Files over 500KB are truncated.',
  inputSchema: getFileSchema,
  handler: async (args: Record<string, unknown>) => {
    const parsed = getFileSchema.parse(args);
    const oct = getOctokit();
    const branch = parsed.branch ?? (await getDefaultBranch());
    const { data } = await oct.repos.getContent({
      owner: getOwner(),
      repo: getRepo(),
      path: parsed.path,
      ref: branch,
    });
    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Path ${parsed.path} is not a file (it is a ${Array.isArray(data) ? 'directory' : data.type}).`);
    }
    const file = data as {
      type: 'file';
      path: string;
      sha: string;
      size: number;
      content?: string;
      encoding?: string;
    };
    let content = '';
    if (file.content && file.encoding === 'base64') {
      content = Buffer.from(file.content, 'base64').toString('utf-8');
    }
    let truncated = false;
    if (content.length > MAX_BYTES) {
      content = content.slice(0, MAX_BYTES);
      truncated = true;
    }
    return {
      path: file.path,
      content,
      sha: file.sha,
      size: file.size,
      branch,
      truncated,
      ...(truncated
        ? { truncated_note: `Content truncated to ${MAX_BYTES} bytes; this file is too large for a single read.` }
        : {}),
    };
  },
};
