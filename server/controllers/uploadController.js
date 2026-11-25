/**
 * uploadController.js
 * Handles POST /api/upload — receives a single file via multipart/form-data,
 * saves it to server/uploads/, and returns the publicly-accessible URL + mediaType.
 */

import path from 'path';

/**
 * POST /api/upload
 * Expects: multipart/form-data with field name 'file'
 * Returns: { url: string, mediaType: 'image' | 'video' }
 *
 * The URL returned is relative to the Express server so the client can
 * construct the full URL as `http://localhost:5000${url}`.
 */
export const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided. Send a file in the "file" field.' });
  }

  const { file } = req;
  const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

  // Build the public URL path relative to Express server root.
  // The file is stored at e.g. server/uploads/1234-5678.jpg
  // Express serves /uploads/* → server/uploads/*
  // So we strip the absolute path prefix to get /uploads/<filename>
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  let relativePath = file.path.replace(uploadsRoot, '').replace(/\\/g, '/');
  if (!relativePath.startsWith('/')) relativePath = '/' + relativePath;

  const url = `/uploads${relativePath}`;

  return res.status(201).json({ url, mediaType });
};
