// this will be specifically designed based on
// the device of the user
// The pop up modal should show only in desktop

import { useState } from 'react';

export default function CreatePostForm() {

  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewURL(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formData = new FormData();
  formData.append("content", content);
  formData.append("image", imageFile.file[0]);

    const token = localStorage.getItem('accessToken');

  const handleSubmit = async () => {
    await fetch('https://localhost/api/posts', {
    method: 'POST',
     headers: {
    Authorization: `Bearer ${token}`,
  },
    body: formData,
  }
  )  .then(response => response.json())
  .then(data => {
    console.log('Post created:', data);
    // Optionally reset form fields here
  })
  .catch(error => {
    console.error('Error creating post:', error);
  });
}

return (
  <div className="create-post-form">
    <textarea
      placeholder="What's on your mind?"
      value={content}
      onChange={handleContentChange}
    />
    <input type="file" accept="image/*" onChange={handleImageChange} />
    {previewURL && <img src={previewURL} alt="Preview" />}
    <button onClick={handleSubmit}>Post</button>
  </div>
);

}

