import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Camera, Download, Trash2, Share2 } from 'lucide-react';

const FRAME_URL = "/twibbon.png";
const WATERMARK_TEXT = "Dibuat oleh Verdoank";

export default function App() {
  // State Tema & UI
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [hasImage, setHasImage] = useState(false);

  // Refs Utama
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const frameImgRef = useRef(null);
  const userImgRef = useRef(null);

  // Transformasi Foto (Direct Ref agar bebas lag/re-render)
  const photoPos = useRef({ x: 0, y: 0 });
  const photoScale = useRef(1);
  const isInteracting = useRef(false);

  // Variable Bantuan Gestur
  const isDragging = useRef(false);
  const startDragPos = useRef({ x: 0, y: 0 });
  const initialPinchDist = useRef(null);
  const initialScale = useRef(1);
  const animFrameId = useRef(null);

  // Sync Tema Dark Mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Load Bingkai Twibbon
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = FRAME_URL;
    img.onload = () => {
      frameImgRef.current = img;
      requestDraw();
    };
  }, []);

  // Fungsi Render Canvas Utama (Tampilan Preview Tanpa Watermark)
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Gambar Foto User
    if (userImgRef.current) {
      ctx.save();
      ctx.translate(canvas.width / 2 + photoPos.current.x, canvas.height / 2 + photoPos.current.y);
      ctx.scale(photoScale.current, photoScale.current);
      ctx.drawImage(
        userImgRef.current,
        -userImgRef.current.width / 2,
        -userImgRef.current.height / 2
      );
      ctx.restore();
    } else {
      ctx.fillStyle = isDark ? "#64748b" : "#94a3b8";
      ctx.font = "600 36px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Upload Foto Anda Di Sini", canvas.width / 2, canvas.height / 2);
    }

    // 2. Gambar Bingkai Frame (Efek Transparan saat Digeser)
    if (frameImgRef.current) {
      ctx.save();
      ctx.globalAlpha = isInteracting.current && userImgRef.current ? 0.55 : 1.0;
      ctx.drawImage(frameImgRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  };

  const requestDraw = () => {
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    animFrameId.current = requestAnimationFrame(drawCanvas);
  };

  // Watermark Khusus untuk Hasil Ekspor
  const drawWatermark = (ctx, canvas) => {
    ctx.save();
    const fontSize = Math.round(canvas.width * 0.025);
    const margin = Math.round(canvas.width * 0.03);
    
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";

    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText(WATERMARK_TEXT, canvas.width - margin, canvas.height - margin);
    ctx.restore();
  };

  // Helper untuk Membuat Offscreen Canvas Ekspor (Agar Preview Layar Tidak Berkedip)
  const createExportCanvas = () => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return null;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = mainCanvas.width;
    exportCanvas.height = mainCanvas.height;
    const ctx = exportCanvas.getContext("2d");

    // Salin canvas preview dan gambar watermark hanya di memori
    ctx.drawImage(mainCanvas, 0, 0);
    drawWatermark(ctx, exportCanvas);

    return exportCanvas;
  };

  // Upload Foto User
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        userImgRef.current = img;
        const canvas = canvasRef.current;
        const scaleW = canvas.width / img.width;
        const scaleH = canvas.height / img.height;
        
        photoScale.current = Math.max(scaleW, scaleH);
        photoPos.current = { x: 0, y: 0 };
        setHasImage(true);
        requestDraw();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Helper Koordinat & Jarak
  const getCanvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const getDistance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Listener Touch & Mouse Native
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleTouchStart = (e) => {
      if (!userImgRef.current) return;
      e.preventDefault();
      isInteracting.current = true;

      if (e.touches.length === 1) {
        isDragging.current = true;
        const coords = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
        startDragPos.current = {
          x: coords.x - photoPos.current.x,
          y: coords.y - photoPos.current.y
        };
      } else if (e.touches.length === 2) {
        isDragging.current = false;
        initialPinchDist.current = getDistance(e.touches[0], e.touches[1]);
        initialScale.current = photoScale.current;
      }
      requestDraw();
    };

    const handleTouchMove = (e) => {
      if (!userImgRef.current) return;
      e.preventDefault();

      if (e.touches.length === 1 && isDragging.current) {
        const coords = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
        photoPos.current = {
          x: coords.x - startDragPos.current.x,
          y: coords.y - startDragPos.current.y
        };
        requestDraw();
      } else if (e.touches.length === 2 && initialPinchDist.current) {
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        if (currentDist > 0) {
          const ratio = currentDist / initialPinchDist.current;
          photoScale.current = initialScale.current * ratio;
          requestDraw();
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) initialPinchDist.current = null;
      if (e.touches.length === 0) {
        isDragging.current = false;
        isInteracting.current = false;
        requestDraw();
      }
    };

    const handleMouseDown = (e) => {
      if (!userImgRef.current) return;
      isDragging.current = true;
      isInteracting.current = true;
      const coords = getCanvasCoords(e.clientX, e.clientY);
      startDragPos.current = {
        x: coords.x - photoPos.current.x,
        y: coords.y - photoPos.current.y
      };
      requestDraw();
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current || !userImgRef.current) return;
      const coords = getCanvasCoords(e.clientX, e.clientY);
      photoPos.current = {
        x: coords.x - startDragPos.current.x,
        y: coords.y - startDragPos.current.y
      };
      requestDraw();
    };

    const handleMouseUp = () => {
      if (isInteracting.current) {
        isDragging.current = false;
        isInteracting.current = false;
        requestDraw();
      }
    };

    const handleWheel = (e) => {
      if (!userImgRef.current) return;
      e.preventDefault();
      isInteracting.current = true;
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      photoScale.current *= zoomFactor;
      requestDraw();

      setTimeout(() => {
        isInteracting.current = false;
        requestDraw();
      }, 200);
    };

    wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrapper.addEventListener('touchend', handleTouchEnd);
    wrapper.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    wrapper.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
      wrapper.removeEventListener('touchend', handleTouchEnd);
      wrapper.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      wrapper.removeEventListener('wheel', handleWheel);
    };
  }, [hasImage]);

  // Actions
  const handleDownload = () => {
    const exportCanvas = createExportCanvas();
    if (!exportCanvas) return;

    const link = document.createElement("a");
    link.download = "twibbon-saya.png";
    link.href = exportCanvas.toDataURL("image/png", 1.0);
    link.click();
  };

  const handleShare = async () => {
    if (!navigator.share) {
      alert("Fitur Web Share tidak didukung di browser ini. Gunakan tombol unduh.");
      return;
    }

    const exportCanvas = createExportCanvas();
    if (!exportCanvas) return;

    exportCanvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "twibbon.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Twibbon Saya",
            text: "Lihat hasil twibbon saya!",
            files: [file]
          });
        } catch (err) {
          if (err.name !== "AbortError") alert("Gagal membagikan gambar.");
        }
      }
    }, "image/png");
  };

  const handleReset = () => {
    userImgRef.current = null;
    setHasImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    requestDraw();
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-3 py-6 pb-20">
      
      {/* Floating Theme Toggle dengan Tooltip */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center opacity-50 hover:opacity-100 focus:opacity-100 active:opacity-100 transition-all duration-300 z-50 hover:scale-110"
        aria-label="Toggle Theme"
        title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
      >
        {isDark ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-indigo-600" />}
      </button>

      {/* Header */}
      <header className="text-center mb-5 max-w-xl">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
          Twibbon Maker Online
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
          Unggah foto, sesuaikan posisi & ukuran, lalu unduh secara instan!
        </p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col items-center gap-4 transition-colors">
        
        {/* Canvas Wrapper */}
        <div
          ref={wrapperRef}
          className="canvas-container relative w-full aspect-square bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center cursor-move"
        >
          <canvas ref={canvasRef} width={1080} height={1080} className="w-full h-full block" />
        </div>

        {/* Action Controls */}
        <div className="w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {!hasImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
              title="Pilih foto dari galeri/perangkat kamu"
            >
              <Camera className="w-6 h-6" /> Pilih Foto Kamu
            </button>
          ) : (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleDownload}
                className="w-14 h-14 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-600 active:scale-95 transition-all"
                title="Unduh Hasil Twibbon"
              >
                <Download className="w-6 h-6" />
              </button>

              <button
                onClick={handleReset}
                className="w-14 h-14 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 active:scale-95 transition-all"
                title="Hapus foto & ganti foto baru"
              >
                <Trash2 className="w-6 h-6" />
              </button>

              <button
                onClick={handleShare}
                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                title="Bagikan hasil twibbon ke media sosial"
              >
                <Share2 className="w-6 h-6" /> Bagikan
              </button>
            </div>
          )}
        </div>
      </main>

      {/* SEO Article Section */}
      <article className="w-full max-w-xl mt-8 bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl shadow-md text-slate-700 dark:text-slate-300 leading-relaxed transition-colors">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Solusi Praktis Buat Twibbon Secara Online & Gratis
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-4">
          Selamat datang di <strong className="text-slate-800 dark:text-slate-200">Twibbon Maker Online</strong>, platform berbasis web tercepat dan terpraktis untuk memasangkan foto profil favorit Kamu ke dalam bingkai twibbon acara, kampanye, atau selebrasi organisasi.
        </p>

        <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mt-5 mb-2">
          Mengapa Menggunakan Web Aplikasi Twibbon Ini?
        </h3>
        <ul className="list-disc pl-5 text-sm sm:text-base text-slate-500 dark:text-slate-400 space-y-1 mb-4">
          <li><strong>Tanpa Install Aplikasi:</strong> Hemat ruang penyimpanan perangkat Kamu.</li>
          <li><strong>Kontrol Sentuh Intuitif:</strong> Drag dan pinch zoom yang halus dan ringan.</li>
          <li><strong>Kualitas Tinggi (HD 1080p):</strong> Hasil tajam tanpa mengurangi resolusi awal.</li>
          <li><strong>Aman & Privat:</strong> Proses dilakukan 100% langsung di browser Kamu.</li>
        </ul>

        <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mt-5 mb-2">
          Cara Menggunakan Twibbon Maker
        </h3>
        <ol className="list-decimal pl-5 text-sm sm:text-base text-slate-500 dark:text-slate-400 space-y-1 mb-4">
          <li>Klik <strong>"Pilih Foto Kamu"</strong> untuk memilih gambar.</li>
          <li>Geser dan perbesar/perkecil foto hingga pas di dalam bingkai.</li>
          <li>Klik tombol <strong>Unduh</strong> atau <strong>Bagikan</strong> hasil karya Kamu.</li>
        </ol>
      </article>

      <footer className="mt-8 text-center text-xs sm:text-sm text-slate-400">
        &copy; 2026 Twibbon Maker Online. All Rights Reserved.
      </footer>
    </div>
  );
                  }
