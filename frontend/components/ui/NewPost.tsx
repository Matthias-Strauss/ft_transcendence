// this will be specifically designed based on
// the device of the user
// The pop up modal should show only in desktop

import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

export default function CreatePostForm() {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [gameTag, setGameTag] = useState('');

  const handleContentChange = (e) => {
    const value = e.target.value;

    setContent(value);

    if (value.startsWith('#')) {
      const tag = value.split(' ')[0];
      if (tag.length > 1) {
        setGameTag(tag);
      }
    }
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
    e.target.value = null;
  };

  const formData = new FormData();
  formData.append('content', content);
  if (imageFile !== null) formData.append('image', imageFile);
  if (gameTag !== '') formData.append('gameTag', gameTag);
  const token = localStorage.getItem('accessToken');

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Post created:', data);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className="border-b border-[#39444d] p-4">
      <div className="flex gap-3">
        <div className="size-12 rounded-full bg-gradient-to-br from-[var(--color-1)] to-[var(--color-2)] shrink-0" />

        <div className="flex-1">
          <textarea
            placeholder="What's happening in your game?"
            className="w-full bg-transparent text-[20px] text-[#f7f9f9] placeholder:text-[#8b98a5] resize-none outline-none mb-3"
            value={content}
            onChange={handleContentChange}
            rows={2}
          />

          {previewURL && (
            <div className="relative mb-3 inline-block w-full">
              <img
                src={previewURL}
                alt="Preview"
                className="w-full max-h-80 object-cover rounded-2xl border border-[#39444d]"
              />
              <button
                onClick={() => {
                  setPreviewURL(null);
                  setImageFile(null);
                }}
                className="absolute top-0 right-0"
              >
                <X className="size-5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <label className="cursor-pointer text-xl hover:opacity-80 transition">
                <ImagePlus className="size-6 text-[#8b98a5]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <button
              className="px-6 py-2 rounded-full font-bold text-[15px] transition-colors"
              style={{
                background: 'var(--color-1)',
                color: '#f7f9f9',
              }}
              onClick={handleSubmit}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
