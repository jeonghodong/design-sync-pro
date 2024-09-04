/* eslint-disable no-else-return */
/* eslint-disable object-shorthand */
/* eslint-disable consistent-return */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getFileExtension } from '../get-file-extension';
import { uint8ArrayToBase64 } from '../uint8array-to-base64';

export const handleExportIcons = async (
  setStatus: (status: string) => void,
) => {
  setStatus('아이콘 내보내는 중...');
  parent.postMessage({ pluginMessage: { type: 'export-icons' } }, '*');
  // 실제 내보내기 작업이 완료될 때까지 기다리는 로직이 필요할 수 있습니다.
  // 예를 들어, Promise를 반환하거나 콜백을 사용할 수 있습니다.
};

export const updateGithubIcons = async (
  icons: any[],
  githubAPI: any,
  setStatus: (status: string) => void,
) => {
  try {
    setStatus('GitHub 테스트 레포지토리에 아이콘 업로드 중...');

    const branchName = `add-icons-${Date.now()}`;
    const baseBranch = 'feature';

    console.log(`${baseBranch} 브랜치 참조 가져오기...`);
    const mainRef = await githubAPI.getGitRef(baseBranch);
    console.log(`${baseBranch} branch ref:`, JSON.stringify(mainRef, null, 2));

    const commitSha = mainRef.sha;

    console.log('새 브랜치 만들기...');
    try {
      await githubAPI.createGitRef({
        branchName: `${branchName}`,
        sha: commitSha,
      });
      console.log(`새 브랜치 생성됨: ${branchName}`);
    } catch (error) {
      console.error('새 브랜치 생성 중 오류 발생:', error);
      throw new Error('새 브랜치를 생성할 수 없습니다.');
    }

    // 기존 트리 구조 가져오기
    console.log('기존 트리 구조 가져오기...');
    const baseTree = await githubAPI.getGitTree(commitSha);

    const processIcon = async (icon: any) => {
      const iconName = icon.name;
      const fileExtension = getFileExtension(icon.data);
      const iconPath = `src/icons/${iconName}.${fileExtension}`;

      try {
        console.log(
          `아이콘 처리 중: ${iconName}, 감지된 파일 유형: ${fileExtension}`,
        );

        // 파일이 이미 존재하는지 확인
        const existingFile = await githubAPI.getFileContents({
          path: iconPath,
          branch: branchName,
        });

        if (existingFile) {
          console.log(`아이콘 ${iconName}은(는) 이미 존재합니다. 건너뜁니다.`);
          return null;
        }

        let content;
        if (fileExtension.toLowerCase() === 'svg') {
          // SVG 파일인 경우 Base64 디코딩
          const decodedContent = atob(
            uint8ArrayToBase64(new Uint8Array(icon.data)),
          );
          content = decodedContent;
        } else {
          // 다른 파일 형식의 경우 기존 방식대로 처리
          content = uint8ArrayToBase64(new Uint8Array(icon.data));
        }

        return {
          path: iconPath,
          content: content,
          name: iconName,
          encoding: fileExtension.toLowerCase() === 'svg' ? 'utf-8' : 'base64',
        };
      } catch (error) {
        if (error.status === 404) {
          // 파일이 없으면 새로 추가
          let content;
          if (fileExtension.toLowerCase() === 'svg') {
            // SVG 파일인 경우 Base64 디코딩
            const decodedContent = atob(
              uint8ArrayToBase64(new Uint8Array(icon.data)),
            );
            content = decodedContent;
          } else {
            // 다른 파일 형식의 경우 기존 방식대로 처리
            content = uint8ArrayToBase64(new Uint8Array(icon.data));
          }

          return {
            path: iconPath,
            content: content,
            name: iconName,
            encoding:
              fileExtension.toLowerCase() === 'svg' ? 'utf-8' : 'base64',
          };
        }
        console.error(`아이콘 ${iconName} 처리 중 오류 발생:`, error);
        return null;
      }
    };

    console.log('아이콘 처리 중...');
    const processedIcons = await Promise.all(icons.map(processIcon));
    const validIcons = processedIcons.filter(
      (icon): icon is NonNullable<typeof icon> => icon !== null,
    );

    if (validIcons.length > 0) {
      console.log('기존 트리에 새 아이콘 추가 중...');
      const updatedTree = baseTree.concat(
        validIcons.map((icon) => ({
          path: icon.path,
          mode: '100644',
          type: 'blob',
          content: icon.content,
          encoding: icon.encoding,
        })),
      );

      const newTree = await githubAPI.createGitTree({
        base_tree: commitSha,
        tree: updatedTree,
      });

      const newCommit = await githubAPI.createGitCommit({
        message: `add: ${validIcons.length} new icons
        \n\n${validIcons.map((icon) => icon.name).join(', ')}`,
        tree: newTree.sha,
        parents: [commitSha],
      });

      try {
        await githubAPI.updateRef({
          ref: `heads/${branchName}`,
          sha: newCommit.sha,
        });
      } catch (error) {
        console.error('브랜치 업데이트 중 오류 발생:', error);
        throw new Error('브랜치를 업데이트할 수 없습니다.');
      }

      console.log('Pull request 생성 중...');
      const pullRequest = await githubAPI.createPullRequest({
        title: `add: ${validIcons.length} new icons`,
        body: `${
          validIcons.length
        }개의 새로운 아이콘이 추가되었습니다:\n\n${validIcons
          .map((icon) => icon.name)
          .join(', ')}`,
        head: branchName,
        base: baseBranch,
      });
      console.log('Pull request 생성됨:', JSON.stringify(pullRequest, null, 2));

      setStatus(
        `${validIcons.length}개의 아이콘이 GitHub에 업로드되고 PR이 생성되었습니다.`,
      );
      return `${validIcons.length}개의 아이콘이 GitHub 테스트 레포지토리에 업로드되고 PR이 생성되었습니다.`;
    } else {
      setStatus('업로드할 새로운 아이콘이 없습니다.');
      return '업로드할 새로운 아이콘이 없습니다.';
    }
  } catch (error) {
    console.error('아이콘 업로드 중 오류 발생:', error);
    setStatus(
      'GitHub에 아이콘 업로드 중 오류가 발생했습니다. 콘솔에서 자세한 내용을 확인하세요.',
    );
    throw error;
  }
};
