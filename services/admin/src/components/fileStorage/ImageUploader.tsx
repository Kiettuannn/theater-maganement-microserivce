import React, { useState } from 'react';
import axios from 'axios'; 

const CLOUD_NAME = 'dpasjinez';
const UPLOAD_PRESET = 'theater_unsigned';

function ImageUploader({onUploadSuccess}: {onUploadSuccess?: (url: string) => void}) {
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const secureUrl = response.data.secure_url;
      setUploadedImageUrl(secureUrl);
      onUploadSuccess?.(secureUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }finally {
      setLoading(false);
    }

  }
  return(
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
      {loading && <p>Uploading...</p>}

      {uploadedImageUrl && (
      <div>
        <p>Upload successful!</p>
        <img src={uploadedImageUrl} alt="Preview" className="max-w-xs mt-2" />
      </div>)}
    </div> 
  )
}
export { ImageUploader };