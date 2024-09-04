/* eslint-disable no-else-return */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

export const handleDeleteIcons = async (
  setStatus: (status: string) => void,
) => {
  setStatus('아이콘 삭제 중...');
  parent.postMessage({ pluginMessage: { type: 'delete-icons' } }, '*');
  // 실제 내보내기 작업이 완료될 때까지 기다리는 로직이 필요할 수 있습니다.
  // 예를 들어, Promise를 반환하거나 콜백을 사용할 수 있습니다.
};

export const deleteGithubIcons = async (
  icons: { name: string }[],
  githubAPI: any,
  setStatus: (status: string) => void,
) => {
  try {
    setStatus('GitHub 테스트 레포지토리에서 아이콘 삭제 중...');

    const branchName = `delete-icons-${Date.now()}`;
    const branch = 'feature';
    console.log(`${branch} 브랜치 참조 가져오기...`);
    const mainRef = await githubAPI.getGitRef(branch);
    console.log(`${branch} branch ref:`, JSON.stringify(mainRef, null, 2));

    const commitSha = mainRef.sha;

    console.log('새 브랜치 만들기...');
    await githubAPI.createGitRef({
      branchName: `${branchName}`,
      sha: commitSha,
    });

    const checkAndPrepareIconForDeletion = async (icon: { name: string }) => {
      const iconName = icon.name;
      const fileExtensions = ['svg'];
      const results: { path: string; sha: string }[] = [];

      await Promise.all(
        fileExtensions.map(async (fileExtension) => {
          const iconPath = `src/icons/${iconName}.${fileExtension}`;

          try {
            console.log(`삭제 확인 아이콘: ${iconName}.${fileExtension}`);

            const fileInfo = await githubAPI.getFileContents({
              path: iconPath,
              branch: branchName,
            });

            if (fileInfo && 'sha' in fileInfo) {
              console.log(`파일 발견: ${iconPath}`);
              results.push({ path: iconPath, sha: fileInfo.sha });
            } else {
              console.log(`파일을 찾을 수 없거나 디렉터리입니다.: ${iconPath}`);
            }
          } catch (error) {
            console.error(
              `Error checking icon ${iconName}.${fileExtension}:`,
              error,
            );
          }
        }),
      );

      return results;
    };

    console.log('삭제할 아이콘 확인...');
    const filesToDeleteArrays = await Promise.all(
      icons.map(checkAndPrepareIconForDeletion),
    );
    const filesToDelete = filesToDeleteArrays.flat();
    const deletedIcons = filesToDelete.map((file) =>
      file.path.split('/').pop(),
    );

    if (filesToDelete.length > 0) {
      console.log('단일 커밋으로 파일 삭제하기...');
      await githubAPI.deleteMultipleFiles({
        files: filesToDelete,
        message: `delete: remove ${
          deletedIcons.length
        } icons\n\n${deletedIcons.join(', ')}`,
        branch: branchName,
      });

      console.log('풀 리퀘스트 만들기...');
      const pullRequest = await githubAPI.createPullRequest({
        title: `delete: remove ${deletedIcons.length} icons`,
        body: `${
          deletedIcons.length
        }개의 아이콘이 삭제되었습니다:\n\n${deletedIcons.join(', ')}`,
        head: branchName,
        base: branch,
      });
      console.log(
        'Pull request created:',
        JSON.stringify(pullRequest, null, 2),
      );

      setStatus(
        `${deletedIcons.length}개의 아이콘이 GitHub에서 삭제되고 PR이 생성되었습니다.`,
      );
      return `${deletedIcons.length}개의 아이콘이 GitHub 테스트 레포지토리에서 삭제되고 PR이 생성되었습니다.`;
    } else {
      setStatus('삭제할 아이콘이 없습니다.');
    }
  } catch (error) {
    console.error('아이콘 삭제 중 오류 발생:', error);
    setStatus(
      'GitHub에서 아이콘 삭제 중 오류가 발생했습니다. 콘솔에서 자세한 내용을 확인하세요.',
    );
    throw error;
  }
};
