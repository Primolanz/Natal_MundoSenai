import * as THREE from "three";

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat = 1) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function parquetTexture() {
  return canvasTex(512, 512, (c) => {
    const tones = ["#9a6034", "#a86b3a", "#8c552d", "#b37643", "#94592f"];
    const pw = 64, ph = 16;
    c.save();
    c.translate(256, 256);
    c.rotate(Math.PI / 4);
    c.translate(-512, -512);
    for (let y = 0; y < 1024; y += ph)
      for (let x = (y / ph) % 2 ? -32 : 0; x < 1024; x += pw) {
        c.fillStyle = tones[Math.floor(Math.random() * tones.length)]!;
        c.fillRect(x, y, pw, ph);
        c.strokeStyle = "rgba(40,20,10,0.55)";
        c.lineWidth = 1.2;
        c.strokeRect(x, y, pw, ph);
        c.strokeStyle = "rgba(60,30,10,0.12)";
        for (let g = 0; g < 3; g++) {
          c.beginPath();
          const gy = y + 3 + Math.random() * (ph - 6);
          c.moveTo(x, gy);
          c.bezierCurveTo(x + 20, gy + 2, x + 40, gy - 2, x + pw, gy);
          c.stroke();
        }
      }
    c.restore();
  }, 5);
}

export function noiseTexture(base: string, amount = 30, repeat = 4) {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = base;
    c.fillRect(0, 0, 256, 256);
    const img = c.getImageData(0, 0, 256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * amount;
      img.data[i]! += n; img.data[i + 1]! += n; img.data[i + 2]! += n;
    }
    c.putImageData(img, 0, 0);
  }, repeat);
}

export function brickTexture() {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = "#d8cbb8";
    c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32)
      for (let x = (y / 32) % 2 ? -32 : 0; x < 256; x += 64) {
        const v = 180 + Math.random() * 40;
        c.fillStyle = `rgb(${v + 10},${v - 10},${v - 30})`;
        c.fillRect(x + 2, y + 2, 60, 28);
      }
  }, 1);
}

export function paintingTexture() {
  return canvasTex(256, 320, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 320);
    g.addColorStop(0, "#f2b35d");
    g.addColorStop(1, "#e07b39");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 320);
    c.fillStyle = "#fff3d6";
    c.beginPath(); c.arc(190, 70, 26, 0, Math.PI * 2); c.fill();
    const pine = (x: number, s: number, col: string) => {
      c.fillStyle = col;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(x, 320 - s * (1.4 + i * 0.6));
        c.lineTo(x - s * (0.8 - i * 0.12), 320 - s * (0.5 + i * 0.6));
        c.lineTo(x + s * (0.8 - i * 0.12), 320 - s * (0.5 + i * 0.6));
        c.fill();
      }
    };
    pine(70, 70, "#2f5d3a"); pine(150, 95, "#3d7346"); pine(215, 60, "#2a5233");
    c.fillStyle = "#f7efe2"; c.fillRect(0, 290, 256, 30);
  });
}

export function fluffTexture() {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = "#f3efe8";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6000; i++) {
      const v = 215 + Math.random() * 40;
      c.strokeStyle = `rgba(${v},${v},${v - 5},0.6)`;
      const x = Math.random() * 256, y = Math.random() * 256, a = Math.random() * 6.28;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); c.stroke();
    }
  }, 3);
}
