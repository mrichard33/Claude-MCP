import { createOrUpdateFileSchema } from '../schemas.js';
import { getOctokit, getOwner, getRepo } from '../github.js';

// Rejects any path whose final segment starts with `.env` (covers .env,
// .env.local, .env.production, etc., at any depth).
const FORBIDDEN_ENV_FILE = /(^|\/)\.env(\.[^/]+)?$/;

export const createOrUpdateFileTool = {
  name: 'dashboard_create_or_update_file',
  description:
    'Commit a file to the reece-dashboard repo. For updates of existing files, fetch SHA via dashboard_get_file first and pass it as `sha`. Writing to `main` is rejected unless `allow_main:true` is set explicitly. Any path matching `.env*` is refused outright.',
  inputSchema: createOrUpdateFileSchema,
  handler: async (args: Record<string, unknown>) => {
    const parsed = createOrUpdateFileSchema.parse(args);

    if (FORBIDDEN_ENV_FILE.test(parsed.path)) {
      throw new Error(
        `Refusing to write file matching .env* pattern: ${parsed.path}. Environment files never belong in commits.`
      );
    }

    if (parsed.branch === 'main' && !parsed.allow_main) {
      throw new Error(
        'Refusing to write to main branch by default. Pass allow_main:true explicitly to override (and prefer a dev branch instead).'
      );
    }

    const oct = getOctokit();
    try {
      const { data } = await oct.repos.createOrUpdateFileContents({
        owner: getOwner(),
        repo: getRepo(),
        path: parsed.path,
        message: parsed.message,
        content: Buffer.from(parsed.content, 'utf-8').toString('base64'),
        branch: parsed.branch,
        ...(parsed.sha ? { sha: parsed.sha } : {}),
      });
      return {
        path: parsed.path,
        sha: data.content?.sha,
        commit_url: data.commit.html_url,
        branch: parsed.branch,
      };
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 422 && !parsed.sha) {
        throw new Error(
          `File ${parsed.path} already exists on ${parsed.branch}. Call dashboard_get_file to obtain its sha, then retry with sha set.`
        );
      }
      throw err;
    }
  },
};
