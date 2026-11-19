import React, { useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Trash2 } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT_REGEX = /\.(jpe?g|png|webp)$/i;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface SingleImageUploadProps {
  multiple?: false;
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  helperText?: string;
  previewShape?: 'square' | 'circle';
}

interface MultiImageUploadProps {
  multiple: true;
  label: string;
  values: string[];
  onChange: (dataUrls: string[]) => void;
  maxFiles?: number;
  helperText?: string;
}

type ImageUploadFieldProps = SingleImageUploadProps | MultiImageUploadProps;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
    reader.readAsDataURL(file);
  });
}

function validateImageFile(file: File): string | null {
  const validType =
    ALLOWED_TYPES.includes(file.type) || ALLOWED_EXT_REGEX.test(file.name);
  if (!validType) {
    return `Tệp "${file.name}" sai định dạng. Chỉ chấp nhận ảnh .JPG, .JPEG, .PNG hoặc .WEBP.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `Tệp "${file.name}" (${sizeMb}MB) vượt quá dung lượng tối đa 5MB.`;
  }
  return null;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = (props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setError(null);

    if (props.multiple) {
      const maxFiles = props.maxFiles ?? 4;
      const remaining = maxFiles - props.values.length;
      if (remaining <= 0) {
        setError(`Chỉ được đính kèm tối đa ${maxFiles} hình ảnh.`);
        return;
      }

      const selected = files.slice(0, remaining);
      for (const file of selected) {
        const validationErr = validateImageFile(file);
        if (validationErr) {
          setError(validationErr);
          return;
        }
      }

      try {
        const urls = await Promise.all(selected.map(readFileAsDataUrl));
        props.onChange([...props.values, ...urls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải hình ảnh.');
      }
    } else {
      const file = files[0];
      const validationErr = validateImageFile(file);
      if (validationErr) {
        setError(validationErr);
        return;
      }
      try {
        const url = await readFileAsDataUrl(file);
        props.onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải hình ảnh.');
      }
    }
  };

  if (props.multiple) {
    const maxFiles = props.maxFiles ?? 4;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-zinc-700">
            {props.label}
          </label>
          <span className="text-[11px] text-zinc-400">
            {props.values.length}/{maxFiles} ảnh • JPG, PNG, WEBP ≤ 5MB
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {props.values.map((img, idx) => (
            <div
              key={`${idx}-${img.slice(0, 24)}`}
              className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group"
            >
              <img
                src={img}
                alt={`Ảnh đính kèm ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  props.onChange(props.values.filter((_, i) => i !== idx))
                }
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Gỡ ảnh"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {props.values.length < maxFiles && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-16 h-16 rounded-xl border border-dashed border-zinc-300 hover:border-zinc-500 bg-[#f8f9fa] hover:bg-zinc-100 flex flex-col items-center justify-center gap-1 text-zinc-500 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              <span className="text-[10px] font-medium">Thêm ảnh</span>
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {props.helperText && (
          <p className="text-[11px] text-zinc-400">{props.helperText}</p>
        )}

        {error && (
          <div className="flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  const shapeClass =
    props.previewShape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-zinc-700">
        {props.label}
      </label>

      <div className="flex items-center gap-3.5">
        <div
          className={`w-16 h-16 ${shapeClass} overflow-hidden border border-zinc-200 bg-[#f8f9fa] flex items-center justify-center shrink-0`}
        >
          {props.value ? (
            <img
              src={props.value}
              alt="Xem trước hình ảnh"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlus className="w-5 h-5 text-zinc-400" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs font-medium text-zinc-800 transition-colors"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>{props.value ? 'Đổi hình ảnh' : 'Tải ảnh lên'}</span>
            </button>

            {props.value && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  props.onChange('');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-medium text-zinc-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa ảnh</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-400">
            {props.helperText || 'Hỗ trợ tệp .JPG, .JPEG, .PNG, .WEBP (tối đa 5MB).'}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
