import { forwardRef, useState, type ChangeEvent } from 'react';
import { apiFetch } from '../../utils/api';
import { ImagePlus, X } from 'lucide-react';
import showToast from '../../utils/toast';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

const CreatePostForm = forwardRef<HTMLTextAreaElement, CreatePostFormProps>(
  ({ onPostCreated }, ref) => {
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [gameTag, setGameTag] = useState('');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'FRIENDS'>('FRIENDS');

    const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;

      setContent(value);

      if (value.includes('#')) {
        const tag = value.split('#')[1];
        if (tag.length > 1) {
          setGameTag(tag);
        }
      }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPreviewURL(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    };

    const handleSubmit = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Access token missing');
        }

        const formData = new FormData();
        formData.append('content', content);
        formData.append('visibility', visibility);
        if (imageFile !== null) formData.append('image', imageFile);
        if (gameTag !== '') formData.append('gameTag', gameTag);

        const response = await apiFetch('/api/posts', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await response.json();

        setContent('');
        setImageFile(null);
        setPreviewURL(null);
        setGameTag('');
        onPostCreated?.();
        showToast('Post created successfully!', 'success');
      } catch (error) {
        showToast('Error creating post. Please try again.', 'error');
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
              ref={ref}
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

              <div className="flex items-center gap-3">
                <span className="text-sm text-[#8b98a5]">Visibility:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('FRIENDS')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      visibility === 'FRIENDS'
                        ? 'bg-[var(--color-1)] text-[#f7f9f9]'
                        : 'text-[#8b98a5] hover:bg-[#1e293b]'
                    }`}
                  >
                    Friends
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('PUBLIC')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      visibility === 'PUBLIC'
                        ? 'bg-[var(--color-1)] text-[#f7f9f9]'
                        : 'text-[#8b98a5] hover:bg-[#1e293b]'
                    }`}
                  >
                    Global
                  </button>
                </div>
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
  },
);

CreatePostForm.displayName = 'CreatePostForm';

export default CreatePostForm;
