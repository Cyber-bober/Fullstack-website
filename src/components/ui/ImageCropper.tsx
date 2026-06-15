// src/components/ui/ImageCropper.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  
  // ✅ ДОБАВЛЕНО: Состояние для хранения размеров изображения
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  // Получаем реальные размеры картинки при загрузке
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
  }, [imageSrc]);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area, rotation: number) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

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

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "avatar-cropped.png", { type: "image/png" }));
        } else {
          resolve(null);
        }
      }, "image/png");
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setPixelCrop(croppedAreaPixels);
  }, []);

  const handleFinalSave = useCallback(async () => {
    if (!pixelCrop || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const croppedFile = await getCroppedImg(imageSrc, pixelCrop, rotation);
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
    } catch (e) {
      console.error("Ошибка обрезки:", e);
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, rotation, pixelCrop, onCropComplete, isProcessing]);

  return (
    // ✅ ИСПРАВЛЕНИЕ 1: Добавлен overflow-y-auto и max-h-screen, чтобы окно можно было прокрутить
    <div className="modal-overlay" style={{ 
      zIndex: 99999, 
      background: 'rgba(0,0,0,0.85)',
      overflowY: 'auto',
      padding: '20px 0'
    }}>
      <div className="modal-content" style={{ 
        maxWidth: '600px', 
        width: '95%',
        margin: 'auto' // Центрирование по вертикали при прокрутке
      }}>
        <h3>Настройка аватара</h3>
        
        {/* ✅ ИСПРАВЛЕНИЕ 2: Уменьшена высота до 300px, чтобы влезало на экраны ноутбуков */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '300px', 
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
            onCropComplete={onCropCompleteHandler}
            // ✅ ИСПРАВЛЕНИЕ 3: initialCroppedAreaPercentages помогает центрировать портретные фото
            {...(imageSize && {
              initialCroppedAreaPercentages: {
                width: 100,
                height: 100,
                x: 0,
                y: 0
              }
            })}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
            Масштаб: {Math.round(zoom * 100)}%
          </label>
          <input 
            type="range" min={1} max={3} step={0.1} value={zoom} 
            onChange={(e) => setZoom(Number(e.target.value))} 
            style={{ width: '100%', accentColor: '#0160ce' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
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
          <button className="btn btn-secondary" onClick={onCancel} disabled={isProcessing}>Отмена</button>
          <button 
            className="btn btn-primary" 
            onClick={handleFinalSave} 
            disabled={isProcessing || !pixelCrop}
          >
            {isProcessing ? "Обработка..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}