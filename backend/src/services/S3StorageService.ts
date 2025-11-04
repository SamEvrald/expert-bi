import { s3, s3Config } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export class S3StorageService {
  /**
   * Upload file to S3
   */
  static async uploadFile(filePath: string, fileName: string, userId: number): Promise<string> {
    try {
      const fileContent = fs.readFileSync(filePath);
      const key = `datasets/${userId}/${uuidv4()}-${fileName}`;
      
      const params = {
        Bucket: s3Config.bucketName,
        Key: key,
        Body: fileContent,
        ContentType: 'text/csv',
        Metadata: {
          userId: userId.toString(),
          originalName: fileName
        }
      };

      const result = await s3.upload(params).promise();
      return result.Key;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Download file from S3
   */
  static async downloadFile(key: string): Promise<Buffer> {
    try {
      const params = {
        Bucket: s3Config.bucketName,
        Key: key
      };

      const result = await s3.getObject(params).promise();
      return result.Body as Buffer;
    } catch (error) {
      console.error('S3 download error:', error);
      throw new Error('Failed to download file from S3');
    }
  }

  /**
   * Generate presigned URL for file access
   */
  static async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: s3Config.bucketName,
        Key: key,
        Expires: expiresIn
      };

      return s3.getSignedUrl('getObject', params);
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Delete file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const params = {
        Bucket: s3Config.bucketName,
        Key: key
      };

      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }
}