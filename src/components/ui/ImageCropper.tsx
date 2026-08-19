"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
  title?: string;
  shape?: "rect" | "round";
  aspect?: number;
  filePrefix?: string;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  title = "Настройка фото новости",
  shape = "rect",
  aspect = 16 / 9,
  filePrefix = "news",
}: ImageCropperProps) {
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
          const timestamp = Date.now();
          resolve(new File([blob], `${filePrefix}-${timestamp}.jpg`, { type: "image/jpeg" }));
        } else {
          resolve(null);
        }
      }, "image/jpeg", 0.92);
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
      onKeyDown={(e) => { if (e.key === 'Enter') handleFinalSave(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10001,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div
        className="image-cropper-modal glass-effect"
        style={{
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          margin: 'auto',
        }}
      >
        <button
          onClick={onCancel}
          disabled={isProcessing}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            fontSize: '20px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          ×
        </button>

        <h3 style={{
          color: 'var(--text-primary)',
          marginBottom: '20px',
          fontSize: 'clamp(18px, 3vw, 24px)',
          fontWeight: 700,
          textAlign: 'center',
          paddingRight: '40px',
        }}>
          {title}
        </h3>

        <div
          className="cropper-container"
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(250px, 50vh, 500px)',
            background: '#0f0f1e',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={shape}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        <div className="cropper-controls" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: 'clamp(13px, 2vw, 15px)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Масштаб
              </label>
              <span style={{
                fontSize: 'clamp(12px, 2vw, 14px)',
                color: 'var(--color-primary)',
                fontWeight: 700,
                background: 'rgba(59, 130, 246, 0.15)',
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
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>

          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: 'clamp(13px, 2vw, 15px)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Поворот
              </label>
              <span style={{
                fontSize: 'clamp(12px, 2vw, 14px)',
                color: 'var(--color-success)',
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
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-success)' }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: '28px', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              flex: '1 1 auto',
              minWidth: '120px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
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
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isProcessing || !pixelCrop ? 'not-allowed' : 'pointer',
              opacity: isProcessing || !pixelCrop ? 0.6 : 1,
            }}
          >
            {isProcessing ? "Обработка..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
