// src/components/ui/ImageCropper.tsx
"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area, rotation: number) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);
    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(0, 0, safeArea, safeArea);
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "avatar-cropped.png", { type: "image/png" });
          resolve(file);
        }
      }, "image/png");
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const handleCropComplete = useCallback(
    async (_croppedArea: Area, croppedAreaPixels: Area) => {
      try {
        const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
        if (croppedFile) onCropComplete(croppedFile);
      } catch (e) {
        console.error(e);
      }
    },
    [imageSrc, rotation, onCropComplete]
  );

  return (
    // ✅ ИСПОЛЬЗУЕМ КЛАСС .modal-overlay ИЗ ТВОЕГО CSS (z-index: 1000)
    // Но добавляем inline-style для гарантии перекрытия всего контента
    <div className="modal-overlay" style={{ zIndex: 99999, background: 'rgba(0,0,0,0.85)' }}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
        <h3>Настройка аватара</h3>
        
        {/* ✅ ЖЕСТКИЕ СТИЛИ ДЛЯ КОНТЕЙНЕРА КРОПА */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '400px', // Фиксированная высота обязательна!
          background: '#f3f4f6',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
            Масштаб: {Math.round(zoom * 100)}%
          </label>
          <input 
            type="range" min={1} max={3} step={0.1} value={zoom} 
            onChange={(e) => setZoom(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#0160ce' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
            Поворот: {rotation}°
          </label>
          <input 
            type="range" min={0} max={360} step={1} value={rotation} 
            onChange={(e) => setRotation(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#0160ce' }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onCancel}>Отмена</button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleCropComplete({ x: 0, y: 0, width: 100, height: 100 }, { x: 0, y: 0, width: 100, height: 100 })}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}