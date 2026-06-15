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
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);

  // Сохраняем пиксельные координаты при каждом изменении кропа
  const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setPixelCrop(croppedAreaPixels);
  }, []);

  // Функция для создания HTMLImageElement из URL
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  // Основная функция обрезки с учетом поворота
  const getCroppedImg = async (imageSrc: string, pixelCrop: Area, rotation: number) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return null;

    // Устанавливаем размер холста равным размеру области обрезки
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Рисуем изображение с учетом поворота и смещения
    drawRotatedImage(ctx, image, pixelCrop, rotation);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "avatar-cropped.png", { type: "image/png" }));
        } else {
          resolve(null);
        }
      }, "image/png", 0.95);
    });
  };

  // Вспомогательная функция для корректной отрисовки повернутого изображения
  const drawRotatedImage = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, crop: Area, rotation: number) => {
    const { width, height } = image;
    const { x, y, width: cropWidth, height: cropHeight } = crop;
    
    // 1. Создаем временный холст размером с оригинал
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d")!;
    
    // 2. Рисуем на нем повернутое изображение
    tempCtx.translate(width / 2, height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.drawImage(image, -width / 2, -height / 2);
    
    // 3. Вырезаем нужную область из временного холста на основной
    ctx.drawImage(
      tempCanvas,
      x, y, cropWidth, cropHeight, // source
      0, 0, cropWidth, cropHeight  // destination
    );
  };

  // Обработчик сохранения (вызывается по кнопке или Enter)
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
    <div 
      className="modal-overlay" 
      style={{ zIndex: 99999, background: 'rgba(0,0,0,0.85)', overflowY: 'auto', padding: '20px 0' }}
      onKeyDown={(e) => { if (e.key === 'Enter') handleFinalSave(); }} // ✅ Обработка Enter
    >
      <div className="modal-content" style={{ maxWidth: '600px', width: '95%', margin: 'auto' }}>
        <h3>Настройка аватара</h3>
        
        <div style={{ 
          position: 'relative', width: '100%', height: '300px', 
          background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px'
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