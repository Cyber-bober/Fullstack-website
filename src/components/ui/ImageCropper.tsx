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

  const onCropCompleteHandler = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setPixelCrop(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area, rotation: number) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

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

  const drawRotatedImage = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, crop: Area, rotation: number) => {
    const { width, height } = image;
    const { x, y, width: cropWidth, height: cropHeight } = crop;
    
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d")!;
    
    tempCtx.translate(width / 2, height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.drawImage(image, -width / 2, -height / 2);
    
    ctx.drawImage(
      tempCanvas,
      x, y, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
  };

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
      style={{ 
        zIndex: 99999, 
        background: 'rgba(0, 0, 0, 0.9)', 
        overflow: 'auto',
        padding: '20px 10px'
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') handleFinalSave(); }}
    >
      <div 
        className="image-cropper-modal"
        style={{
          maxWidth: '800px',
          width: '100%',
          margin: '10px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '20px',
          padding: '5px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        <h3 style={{ 
          color: '#fff', 
          marginBottom: '20px',
          fontSize: 'clamp(18px, 3vw, 24px)',
          fontWeight: 700,
          textAlign: 'center'
        }}>
          Настройка аватара
        </h3>
        
        {/* Область кроппера - адаптивная высота */}
        <div 
          className="cropper-container"
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(300px, 50vh, 500px)',
            background: '#0f0f1e',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '24px',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        {/* Контролы - адаптивные */}
        <div className="cropper-controls" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Масштаб */}
          <div className="control-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <label style={{ 
                fontSize: 'clamp(13px, 2vw, 15px)',
                fontWeight: 600,
                color: '#e0e0e0'
              }}>
                Масштаб
              </label>
              <span style={{
                fontSize: 'clamp(12px, 2vw, 14px)',
                color: '#0160ce',
                fontWeight: 700,
                background: 'rgba(1, 96, 206, 0.15)',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <input 
              type="range" 
              min={1} 
              max={3} 
              step={0.1} 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))}
              className="range-slider"
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none'
              }}
            />
          </div>

          {/* Поворот */}
          <div className="control-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <label style={{ 
                fontSize: 'clamp(13px, 2vw, 15px)',
                fontWeight: 600,
                color: '#e0e0e0'
              }}>
                Поворот
              </label>
              <span style={{
                fontSize: 'clamp(12px, 2vw, 14px)',
                color: '#10b981',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>
                {rotation}°
              </span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={360} 
              step={1} 
              value={rotation} 
              onChange={(e) => setRotation(Number(e.target.value))}
              className="range-slider"
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none'
              }}
            />
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          justifyContent: "flex-end",
          marginTop: '28px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={onCancel} 
            disabled={isProcessing}
            style={{
              flex: '1 1 auto',
              minWidth: '120px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            Отмена
          </button>
          <button 
            onClick={handleFinalSave} 
            disabled={isProcessing || !pixelCrop}
            style={{
              flex: '2 1 auto',
              minWidth: '140px',
              background: 'linear-gradient(135deg, #0160ce 0%, #0059c8 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isProcessing || !pixelCrop ? 'not-allowed' : 'pointer',
              opacity: isProcessing || !pixelCrop ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(1, 96, 206, 0.4)'
            }}
          >
            {isProcessing ? "Обработка..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}