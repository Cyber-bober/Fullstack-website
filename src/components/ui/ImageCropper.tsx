// src/components/ui/ImageCropper.tsx
"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
// ✅ ИСПРАВЛЕНИЕ: Типы импортируются из корня пакета
import type { Point, Area } from "react-easy-crop"; 
import { ImageCropperProps } from "@/types/profile";

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // ... остальной код компонента без изменений ...
  
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
    <div className="cropper-modal-overlay">
      <div className="cropper-modal-content">
        <h3>Настройка аватара</h3>
        <div className="cropper-container">
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

        <div className="cropper-controls">
          <label>Масштаб: {Math.round(zoom * 100)}%</label>
          <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />

          <label>Поворот: {rotation}°</label>
          <input type="range" min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
        </div>

        <div className="cropper-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Отмена</button>
          <button className="btn btn-primary" onClick={() => handleCropComplete({ x: 0, y: 0, width: 100, height: 100 }, { x: 0, y: 0, width: 100, height: 100 })}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}