/* eslint-disable no-console */
import { useCallback, useMemo } from 'react';

import { type RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { Octokit } from 'octokit';

interface UseGithubAPIProps {
  auth: string;
  owner: string;
  repo: string;
}

type CreateBlobParameters =
  RestEndpointMethodTypes['git']['createBlob']['parameters'];
type GetGitTreeParameters =
  RestEndpointMethodTypes['git']['getTree']['parameters'];
type CreateGitTreeParameters =
  RestEndpointMethodTypes['git']['createTree']['parameters'];
type CreateGitCommitParameters =
  RestEndpointMethodTypes['git']['createCommit']['parameters'];
type CreateGitRefParameters =
  RestEndpointMethodTypes['git']['createRef']['parameters'];
type CreatePullRequestParameters =
  RestEndpointMethodTypes['pulls']['create']['parameters'];
type AddLabelsRequestParameters =
  RestEndpointMethodTypes['issues']['addLabels']['parameters'];

function useGithubAPI({ auth, owner, repo }: UseGithubAPIProps) {
  const octokit = useMemo(() => new Octokit({ auth }), [auth]);

  const getGitCommit = useCallback(
    async (sha: string) => {
      const { data } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: sha,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const getGitRef = useCallback(
    async (branchName: string) => {
      console.log(branchName);
      const { data } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
      });
      return data.object;
    },
    [octokit, owner, repo],
  );

  const getGitBlob = useCallback(
    async (fileSha: string) => {
      const { data } = await octokit.rest.git.getBlob({
        owner,
        repo,
        file_sha: fileSha,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const getGitTree = useCallback(
    async (treeSha: GetGitTreeParameters['tree_sha']) => {
      const { data } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: 'true', // 'true'를 문자열로 전달해야 합니다.
      });
      return data.tree;
    },
    [octokit, owner, repo],
  );

  const createGitBlob = useCallback(
    async (content: CreateBlobParameters['content']) => {
      const { data } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content,
        encoding: 'utf-8',
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const createGitCommit = useCallback(
    async (params: {
      message: CreateGitCommitParameters['message'];
      author: CreateGitCommitParameters['author'];
      parents: CreateGitCommitParameters['parents'];
      tree: CreateGitCommitParameters['tree'];
    }) => {
      const { data } = await octokit.rest.git.createCommit({
        owner,
        repo,
        ...params,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const createGitRef = useCallback(
    async ({
      branchName,
      sha,
    }: { branchName: CreateGitRefParameters['ref'] } & Pick<
      CreateGitRefParameters,
      'sha'
    >) => {
      const { data } = await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const createGitTree = useCallback(
    async ({
      baseTreeSha,
      tree,
    }: { baseTreeSha?: CreateGitTreeParameters['base_tree'] } & Pick<
      CreateGitTreeParameters,
      'tree'
    >) => {
      const { data } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const createPullRequest = useCallback(
    async (params: {
      title: CreatePullRequestParameters['title'];
      body: CreatePullRequestParameters['body'];
      head: CreatePullRequestParameters['head'];
      base: CreatePullRequestParameters['base'];
    }) => {
      const { data } = await octokit.rest.pulls.create({
        owner,
        repo,
        ...params,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  /**
   * NOTE: Every pull request is an issue.
   * @see https://docs.github.com/en/rest/issues/labels?apiVersion=2022-11-28#about-labels
   */
  const addLabels = useCallback(
    async ({
      issueNumber,
      labels,
    }: { issueNumber: AddLabelsRequestParameters['issue_number'] } & {
      labels: string[];
    }) => {
      const { data } = await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const updateRef = useCallback(
    async (params: {
      ref: CreateGitRefParameters['ref'];
      sha: CreateGitRefParameters['sha'];
      force?: CreateGitRefParameters['force'];
    }) => {
      const { data } = await octokit.rest.git.updateRef({
        owner,
        repo,
        ...params,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const createOrUpdateFileContents = useCallback(
    async ({
      path,
      message,
      content,
      branch,
    }: {
      path: string;
      message: string;
      content: string;
      branch: string;
    }) => {
      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content,
        branch,
        committer: {
          name: 'atad-designer',
          email: 'andrew@atad.ai',
        },
      });
      return data;
    },
    [octokit, owner, repo],
  );

  const getFileContents = useCallback(
    async ({ path, branch }: { path: string; branch: string }) => {
      try {
        const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: encodedPath,
          ref: branch,
        });
        return data;
      } catch (error) {
        if (error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    [octokit, owner, repo],
  );

  const deleteFile = useCallback(
    async ({
      path,
      message,
      branch,
      sha,
    }: {
      path: string;
      message: string;
      branch: string;
      sha: string;
    }) => {
      const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
      await octokit.rest.repos.deleteFile({
        owner,
        repo,
        path: encodedPath,
        message,
        sha,
        branch,
      });
    },
    [octokit, owner, repo],
  );

  const deleteMultipleFiles = useCallback(
    async ({
      files,
      message,
      branch,
    }: {
      files: { path: string; sha: string }[];
      message: string;
      branch: string;
    }) => {
      // 현재 브랜치의 최신 커밋을 가져옵니다
      const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const currentCommitSha = refData.object.sha;

      // 현재 커밋의 트리를 가져옵니다
      const { data: commitData } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: currentCommitSha,
      });
      const currentTreeSha = commitData.tree.sha;

      // 새 트리를 생성합니다 (파일 삭제를 반영)
      const { data: newTreeData } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: currentTreeSha,
        tree: files.map((file) => ({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null, // null SHA는 파일 삭제를 의미합니다
        })),
      });

      // 새 커밋을 생성합니다
      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree: newTreeData.sha,
        parents: [currentCommitSha],
      });

      // 브랜치를 새 커밋으로 업데이트합니다
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      return newCommit;
    },
    [octokit, owner, repo],
  );

  const getRef = useCallback(
    async (ref: string) => {
      const { data } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref,
      });
      return data;
    },
    [octokit, owner, repo],
  );

  return {
    getGitCommit,
    getRef,
    getGitRef,
    getGitTree,
    getGitBlob,
    getFileContents,
    createGitBlob,
    createGitCommit,
    createGitRef,
    createGitTree,
    createPullRequest,
    deleteFile,
    deleteMultipleFiles,
    addLabels,
    createOrUpdateFileContents,
    updateRef,
  };
}

export default useGithubAPI;
