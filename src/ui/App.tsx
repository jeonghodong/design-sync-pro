/* eslint-disable no-console */
/* eslint-disable react/button-has-type */
import React, { useEffect, useState } from 'react';
import useGithubAPI from '../hooks/useGithubAPI';
import {
  deleteGithubIcons,
  handleDeleteIcons,
} from '../utils/handle-icons/delete-icons';
import {
  handleExportIcons,
  updateGithubIcons,
} from '../utils/handle-icons/update-icons';
import { sendSlackMessage } from '../utils/slack/send-slack-message';

function App() {
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const githubAPI = useGithubAPI({
    auth: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_ORG_NAME,
    repo: process.env.GITHUB_REPO,
  });

  const handleExport = () => {
    setIsProcessing(true);
    handleExportIcons(setStatus).finally(() => setIsProcessing(true));
  };

  const handleDelete = () => {
    setIsProcessing(true);
    handleDeleteIcons(setStatus).finally(() => setIsProcessing(true));
  };

  useEffect(() => {
    window.onmessage = async (event) => {
      const message = event.data.pluginMessage;
      if (
        message.type === 'export-status' ||
        message.type === 'delete-status'
      ) {
        if (!message.data) {
          setIsProcessing(false);
          setStatus('아이콘을 선택해주세요.');
          return;
        }
      }
      if (message.type === 'export-complete') {
        setStatus('내보내기 완료! GitHub 업데이트 중...');
        console.log('icons', message.data.icons);
        try {
          const returnMessage = await updateGithubIcons(
            message.data.icons,
            githubAPI,
            setStatus,
          );
          await sendSlackMessage(returnMessage);
        } finally {
          setIsProcessing(false);
        }
      } else if (message.type === 'delete-complete') {
        setStatus('삭제 완료! GitHub 업데이트 중...');
        console.log('icons to delete', message.data.icons);
        try {
          const returnMessage = await deleteGithubIcons(
            message.data.icons,
            githubAPI,
            setStatus,
          );
          await sendSlackMessage(returnMessage);
        } finally {
          setIsProcessing(false);
        }
      }
    };
  }, [githubAPI]);

  return (
    <div>
      <h1>Design Sync Pro</h1>
      <button
        onClick={handleExport}
        disabled={isProcessing}
        style={{ marginRight: '8px' }}
      >
        {isProcessing ? '처리 중...' : '아이콘 내보내기'}
      </button>
      <button onClick={handleDelete} disabled={isProcessing}>
        {isProcessing ? '처리 중...' : '아이콘 삭제'}
      </button>
      <p>{status}</p>
    </div>
  );
}

export default App;
