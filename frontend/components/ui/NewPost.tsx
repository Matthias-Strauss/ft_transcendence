// this will be specifically designed based on
// the device of the user
// The pop up modal should show only in desktop

import { useState } from 'react';

export default function CreatePost() {
  const token = localStorage.getItem('accessToken');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);

  const formData = new FormData();
}
