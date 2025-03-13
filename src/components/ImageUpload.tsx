import { ChangeEvent, useState, useEffect, useRef } from 'react';
import { ImageIcon, Upload as UploadIcon } from 'lucide-react'; // Assuming you're using lucide-react for icons

interface ImageUploadProps {
  initialImage?: string;
  onImageChange: (imageData: { file?: File; url: string }) => void;
  id?: string;
  maxSizeMB?: number;
  acceptedTypes?: string;
  label?: string;
}

export const ImageUpload = ({
  initialImage = '',
  onImageChange,
  id = 'image',
  maxSizeMB = 2,
  acceptedTypes = 'image/*',
  label = 'Upload an image',
}: ImageUploadProps) => {
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage || null);
  const [cacheBuster, setCacheBuster] = useState<string>(`?t=${Date.now()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update the URL and preview when initialImage changes from parent component
  useEffect(() => {
    setImageUrl(initialImage);
    if (initialImage) {
      setImagePreview(initialImage);
    }
  }, [initialImage]);
  
  // Function to add cache-busting parameter to URLs that aren't data URLs
  const addCacheBuster = (url: string): string => {
    if (!url || url.startsWith('data:')) return url; // Don't add to data URLs or empty strings
    
    // Remove any existing cache-busting query parameter if it exists
    const urlWithoutCacheBusting = url.split('?t=')[0];
    
    // Add the new cache-busting parameter
    return `${urlWithoutCacheBusting}${cacheBuster}`;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('ImageUpload: File selected:', file.name, file.type, file.size);
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }
    
    // Generate a new cache buster for the next image
    setCacheBuster(`?t=${Date.now()}`);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      console.log('ImageUpload: Created data URL for preview (first 50 chars):', result.substring(0, 50) + '...');
      
      // We're just going to pass the file to the parent component
      // and let it set the URL when the Cloudflare URL is available
      console.log('ImageUpload: Calling onImageChange with file object');
      onImageChange({ file, url: '' });
    };
    reader.readAsDataURL(file);
    
    // Reset file input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };
  
  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url || null);
    // Generate a new cache buster when URL changes
    setCacheBuster(`?t=${Date.now()}`);
    onImageChange({ url });
  };
  
  const removeImage = () => {
    setImagePreview(null);
    setImageUrl('');
    onImageChange({ url: '' });
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Get the URL to display in the image (with cache-busting if needed)
  const displayUrl = imagePreview && !imagePreview.startsWith('data:') 
    ? addCacheBuster(imagePreview)
    : imagePreview || '';

  return (
    <div className="space-y-4">
      {/* Hidden file input that can be triggered by the Replace Image button */}
      <input
        ref={fileInputRef}
        id={`${id}-upload-hidden`}
        name={`${id}-upload-hidden`}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Image Preview */}
      {imagePreview && (
        <div className="space-y-3">
          <div className="relative">
            <img 
              src={displayUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Replace Image Button */}
          <button
            type="button"
            onClick={triggerFileInput}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UploadIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Replace Image
          </button>
        </div>
      )}
      
      {/* URL Input Field */}
      <div>
        <label htmlFor={`${id}-url`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Image URL
        </label>
        <input
          type="text"
          id={`${id}-url`}
          value={imageUrl}
          onChange={handleUrlChange}
          placeholder="Enter image URL or upload using button above"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      {/* File Upload Input - Only show when there's no image */}
      {!imagePreview && (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600 dark:text-gray-400">
              <label
                htmlFor={`${id}-upload`}
                className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus-within:outline-none"
              >
                <span>{label}</span>
                <input
                  id={`${id}-upload`}
                  name={`${id}-upload`}
                  type="file"
                  accept={acceptedTypes}
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF up to <span className="font-semibold">{maxSizeMB}MB</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 