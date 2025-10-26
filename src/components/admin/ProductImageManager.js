import React, { useState } from 'react';
import axios from 'axios';

const ProductImageManager = ({ token, productId, productName }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('productName', productName); // Include product name in the request

    try {
      await axios.post(`/api/admin/products/${productId}/images`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
    } catch (err) {
      let errorMsg = 'Failed to upload image';
      if (err.response) {
        errorMsg += `: ${err.response.data.error || err.response.statusText}`;
        if (err.response.data.details) {
          errorMsg += ` (${err.response.data.details})`;
        }
      } else if (err.message) {
        errorMsg += `: ${err.message}`;
      }
      console.error('[Image Upload Error]', err);
      setError(errorMsg);
    }
  };

  return (
    <div>
      <h4>Manage Images</h4>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default ProductImageManager;
