/* eslint-disable no-console */
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (iconPath: string, iconData: Uint8Array) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: iconPath,
    Body: iconData,
    ContentType: 'image/png',
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${iconPath}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

export const deleteFromS3 = async (iconPath: string) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: iconPath,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
    console.log(`Deleted ${iconPath} from S3`);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
};
