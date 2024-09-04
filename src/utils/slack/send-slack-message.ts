/* eslint-disable no-console */
export async function sendSlackMessage(message) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    console.error('Slack 웹훅 URL이 설정되지 않았습니다.');
    return;
  }
  const payload = JSON.stringify({ text: message });

  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });

    console.log('response', response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Message sent to Slack successfully');
  } catch (error) {
    console.error('Error sending message to Slack:', error);
  }
}
