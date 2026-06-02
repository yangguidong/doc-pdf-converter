"""
高清无损放大软件 — Flask Web 版
启动: py app.py  然后浏览器打开 http://127.0.0.1:7860
"""

import io
import os
import sys
import time
import tempfile
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter
from flask import Flask, request, send_file, render_template_string, jsonify

# ============================================================
# GPU 检测
# ============================================================

def detect_gpu():
    try:
        import torch
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            mem = round(torch.cuda.get_device_properties(0).total_mem / (1024**3), 1)
            return name, mem
    except Exception:
        pass
    try:
        import subprocess
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            parts = result.stdout.strip().split(",")
            if len(parts) >= 2:
                name = parts[0].strip()
                mem = round(int(parts[1].strip().replace(" MiB", "")) / 1024, 1)
                return name, mem
    except Exception:
        pass
    return "未检测到独立显卡", 0


GPU_NAME, GPU_MEM = detect_gpu()

# ============================================================
# Patch torchvision for basicsr compatibility
# ============================================================

def _patch_torchvision():
    import sys as _sys
    import torchvision.transforms.functional as F
    class _FT:
        rgb_to_grayscale = staticmethod(F.rgb_to_grayscale)
    _sys.modules.setdefault("torchvision.transforms.functional_tensor", _FT)

# ============================================================
# 引擎层
# ============================================================

class LanczosEngine:
    name = "Lanczos 插值 (轻量)"

    @staticmethod
    def upscale(image, scale):
        w, h = image.size
        result = image.resize((w * scale, h * scale), Image.LANCZOS)
        result = result.filter(ImageFilter.UnsharpMask(radius=2, percent=30, threshold=3))
        return result


class RealESRGANEngine:
    name = "Real-ESRGAN (AI超分辨率)"
    _instances = {}

    _MODEL_URLS = {
        "通用照片": (
            "https://github.com/xinntao/Real-ESRGAN/releases/download/"
            "v0.2.5.0/realesr-general-x4v3.pth"
        ),
        "动漫/插画": (
            "https://github.com/xinntao/Real-ESRGAN/releases/download/"
            "v0.2.5.0/RealESRGAN_x4plus_anime_6B.pth"
        ),
    }

    @staticmethod
    def is_available():
        try:
            import torch
            _patch_torchvision()
            import realesrgan
            return True
        except Exception:
            return False

    @classmethod
    def _find_model(cls, model_key):
        """Look for cached model file, return path (local or URL)."""
        # Fallback for garbled/invalid model keys
        if model_key not in cls._MODEL_URLS:
            model_key = "通用照片"

        import glob as _glob

        search_dirs = []
        import site as _site
        user_site = _site.getusersitepackages()
        if user_site:
            search_dirs.append(os.path.join(user_site, "weights"))
            search_dirs.append(os.path.join(user_site, "realesrgan", "weights"))
        for sp in _site.getsitepackages():
            search_dirs.append(os.path.join(sp, "weights"))
            search_dirs.append(os.path.join(sp, "realesrgan", "weights"))
        search_dirs.append(os.path.expanduser("~/.realesrgan/weights"))

        fname = os.path.basename(cls._MODEL_URLS[model_key])
        for d in search_dirs:
            p = os.path.join(d, fname)
            if os.path.isfile(p):
                return p

        return cls._MODEL_URLS[model_key]

    @classmethod
    def get_upsampler(cls, model_key):
        if model_key in cls._instances:
            return cls._instances[model_key]

        import torch
        _patch_torchvision()
        from realesrgan import RealESRGANer

        model_path = cls._find_model(model_key)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        if "general" in model_path:
            from basicsr.archs.srvgg_arch import SRVGGNetCompact
            model = SRVGGNetCompact(
                num_in_ch=3, num_out_ch=3, num_feat=64,
                num_conv=32, upscale=4, act_type='prelu'
            )
        else:
            from basicsr.archs.rrdbnet_arch import RRDBNet
            model = RRDBNet(
                num_in_ch=3, num_out_ch=3, num_feat=64,
                num_block=23, num_grow_ch=32, scale=4
            )

        upsampler = RealESRGANer(
            scale=4, model_path=model_path, model=model,
            tile=0, tile_pad=10, pre_pad=0,
            half=(device.type == "cuda"), device=device,
        )
        cls._instances[model_key] = upsampler
        return upsampler

    @classmethod
    def upscale(cls, image, scale, model_key="通用照片"):
        upsampler = cls.get_upsampler(model_key)
        img_np = np.array(image)
        output, _ = upsampler.enhance(img_np, outscale=4)
        result = Image.fromarray(output)
        if scale == 2:
            w, h = result.size
            result = result.resize((w // 2, h // 2), Image.LANCZOS)
        return result


AI_AVAILABLE = RealESRGANEngine.is_available()

# ============================================================
# Flask app
# ============================================================

app = Flask(__name__)
UPLOAD_DIR = Path(tempfile.gettempdir()) / "upscale_app"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

HTML = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>高清无损放大软件</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
    background: #f5f5f5; color: #1a1a1a; min-height: 100vh; padding: 20px;
  }
  .header {
    text-align: center; margin-bottom: 16px;
  }
  .header h1 { font-size: 1.8rem; font-weight: 700; }
  .header .status { color: #666; font-size: 0.85rem; margin-top: 4px; }
  .container { max-width: 1100px; margin: 0 auto; }
  .main-row { display: flex; gap: 20px; flex-wrap: wrap; }
  .panel { flex: 1; min-width: 340px; background: #fff; border-radius: 10px;
    border: 1px solid #e0e0e0; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
  .panel h3 { font-size: 1rem; margin-bottom: 12px; color: #333; }
  .dropzone {
    border: 2px dashed #ccc; border-radius: 8px; padding: 40px 20px;
    text-align: center; cursor: pointer; transition: all .2s; margin-bottom: 14px;
    min-height: 180px; display: flex; align-items: center; justify-content: center;
  }
  .dropzone:hover, .dropzone.drag { border-color: #4f46e5; background: #f0f0ff; }
  .dropzone input { display: none; }
  .dropzone img { max-width: 100%; max-height: 240px; border-radius: 4px; }
  .dropzone .placeholder { color: #999; font-size: 0.9rem; }
  .result-box { min-height: 180px; display: flex; align-items: center;
    justify-content: center; margin-bottom: 14px; }
  .result-box img { max-width: 100%; max-height: 280px; border-radius: 4px; }
  .result-box .placeholder { color: #999; font-size: 0.9rem; }
  .controls { margin-bottom: 10px; }
  .controls label { display: block; font-size: 0.85rem; font-weight: 600;
    color: #555; margin-bottom: 4px; }
  .controls select, .controls input { width: 100%; padding: 8px 12px;
    border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem;
    background: #fff; margin-bottom: 10px; }
  .btn {
    width: 100%; padding: 12px; border: none; border-radius: 8px;
    font-size: 1rem; font-weight: 600; cursor: pointer; transition: all .2s;
  }
  .btn-primary { background: #4f46e5; color: #fff; }
  .btn-primary:hover { background: #4338ca; }
  .btn-primary:disabled { background: #a5a5a5; cursor: not-allowed; }
  .btn-secondary { background: #fff; color: #4f46e5; border: 2px solid #4f46e5;
    margin-top: 8px; }
  .btn-secondary:hover { background: #f0f0ff; }
  .info { font-size: 0.8rem; color: #666; background: #f9f9f9;
    padding: 10px; border-radius: 6px; margin-top: 10px; line-height: 1.6; }
  .info strong { color: #333; }
  .progress-bar { display: none; width: 100%; height: 6px; background: #eee;
    border-radius: 3px; margin: 8px 0; overflow: hidden; }
  .progress-bar.active { display: block; }
  .progress-bar .fill { height: 100%; background: #4f46e5; width: 0%;
    border-radius: 3px; transition: width .3s; }
  .warning { background: #fff3cd; color: #856404; padding: 8px 12px;
    border-radius: 6px; font-size: 0.85rem; margin-bottom: 12px; }
  .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
  .tab { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px 6px 0 0;
    background: #f0f0f0; cursor: pointer; font-size: 0.9rem; border-bottom: none; }
  .tab.active { background: #fff; color: #4f46e5; font-weight: 600; }
  .advanced { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
  .advanced summary { cursor: pointer; font-size: 0.85rem; color: #888;
    font-weight: 600; }
  .advanced-content { margin-top: 10px; display: flex; gap: 14px; flex-wrap: wrap; }
  .advanced-content label { flex: 1; min-width: 120px; }
  .notice { text-align: center; color: #999; font-size: 0.75rem; margin-top: 24px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>高清无损放大软件</h1>
    <div class="status">{{ status }}</div>
  </div>

  <div class="main-row">
    <!-- 左面板: 输入 -->
    <div class="panel">
      <h3>原始图片</h3>
      <div class="dropzone" id="dropzone">
        <img id="preview" src="" alt="" style="display:none">
        <span class="placeholder" id="placeholder">点击或拖拽图片到此处</span>
        <input type="file" id="fileInput" accept="image/*">
      </div>
      <div class="controls">
        <label>放大倍率</label>
        <select id="scale"><option value="2">2x</option><option value="4" selected>4x</option></select>
        <label>放大引擎</label>
        <select id="engine">
          <option value="ai" {% if not ai_available %}disabled{% endif %}>Real-ESRGAN (AI超分辨率)</option>
          <option value="lanczos">Lanczos 插值 (轻量)</option>
        </select>
        <label>模型类型 (仅AI引擎)</label>
        <select id="model">
          <option value="通用照片">通用照片</option>
          <option value="动漫/插画">动漫/插画</option>
        </select>
      </div>
      <button class="btn btn-primary" id="startBtn" disabled>开始放大</button>
      <div class="progress-bar" id="progressBar"><div class="fill" id="progressFill"></div></div>
    </div>

    <!-- 右面板: 结果 -->
    <div class="panel">
      <h3>放大结果</h3>
      <div class="result-box">
        <img id="resultImg" src="" alt="" style="display:none">
        <span class="placeholder" id="resultPlaceholder">等待处理...</span>
      </div>
      <div class="info" id="info">上传图片后点击「开始放大」</div>
      <button class="btn btn-secondary" id="downloadBtn" style="display:none">下载结果</button>
    </div>
  </div>

  <details class="advanced">
    <summary>高级设置</summary>
    <div class="advanced-content">
      <label>输出格式
        <select id="format">
          <option value="PNG" selected>PNG (无损)</option>
          <option value="JPEG">JPEG</option>
          <option value="WebP">WebP</option>
        </select>
      </label>
      <label>JPEG质量
        <input type="range" id="quality" min="1" max="100" value="95">
        <span id="qualityVal">95</span>
      </label>
    </div>
  </details>

  <p class="notice">Powered by Real-ESRGAN + Pillow | 本地处理，图片不会上传到任何服务器</p>
</div>

<script>
(function() {
  var file = null;

  // Dropzone
  var dz = document.getElementById('dropzone');
  var fi = document.getElementById('fileInput');
  var preview = document.getElementById('preview');
  var placeholder = document.getElementById('placeholder');

  dz.addEventListener('click', function() { fi.click(); });
  dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', function() { dz.classList.remove('drag'); });
  dz.addEventListener('drop', function(e) {
    e.preventDefault(); dz.classList.remove('drag');
    loadFile(e.dataTransfer.files[0]);
  });
  fi.addEventListener('change', function() { if (fi.files[0]) loadFile(fi.files[0]); });

  function loadFile(f) {
    file = f;
    var reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      document.getElementById('startBtn').disabled = false;
    };
    reader.readAsDataURL(f);
  }

  // Engine change -> toggle model visibility
  document.getElementById('engine').addEventListener('change', function() {
    document.getElementById('model').parentElement.style.display =
      this.value === 'ai' ? 'block' : 'none';
  });

  // Quality slider
  var q = document.getElementById('quality');
  var qv = document.getElementById('qualityVal');
  q.addEventListener('input', function() { qv.textContent = this.value; });

  // Start
  document.getElementById('startBtn').addEventListener('click', function() {
    if (!file) return;
    var btn = this;
    btn.disabled = true;
    btn.textContent = '处理中...';
    var pb = document.getElementById('progressBar');
    var pbf = document.getElementById('progressFill');
    pb.classList.add('active');
    pbf.style.width = '10%';

    var fd = new FormData();
    fd.append('image', file);
    fd.append('scale', document.getElementById('scale').value);
    fd.append('engine', document.getElementById('engine').value);
    fd.append('model', document.getElementById('model').value);
    fd.append('format', document.getElementById('format').value);
    fd.append('quality', document.getElementById('quality').value);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/upscale');

    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        pbf.style.width = Math.min(10 + (e.loaded / e.total) * 40, 50) + '%';
      }
    });

    xhr.addEventListener('load', function() {
      pbf.style.width = '100%';
      setTimeout(function() {
        pb.classList.remove('active');
        pbf.style.width = '0%';
      }, 500);

      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        if (data.success) {
          var ri = document.getElementById('resultImg');
          ri.src = data.result_url;
          ri.style.display = 'block';
          document.getElementById('resultPlaceholder').style.display = 'none';
          document.getElementById('info').innerHTML =
            '<strong>原始尺寸:</strong> ' + data.orig_size + ' (' + data.orig_bytes + ')<br>' +
            '<strong>放大后:</strong> ' + data.result_size + ' (' + data.result_bytes + ')<br>' +
            '<strong>倍率:</strong> ' + data.scale + 'x | <strong>耗时:</strong> ' + data.elapsed + '<br>' +
            '<strong>引擎:</strong> ' + data.engine;
          var db = document.getElementById('downloadBtn');
          db.style.display = 'block';
          db.onclick = function() { window.open(data.download_url, '_blank'); };
        } else {
          alert('处理失败: ' + data.error);
        }
      } else {
        try {
          var e = JSON.parse(xhr.responseText);
          alert('错误: ' + (e.error || '未知错误'));
        } catch(_) {
          alert('服务器错误，请重试');
        }
      }
      btn.disabled = false;
      btn.textContent = '开始放大';
    });

    xhr.addEventListener('error', function() {
      alert('网络错误，请确认服务器在运行');
      btn.disabled = false;
      btn.textContent = '开始放大';
      pb.classList.remove('active');
    });

    xhr.send(fd);
  });
})();
</script>
</body>
</html>"""


def fmt_size(b):
    if b < 1024:
        return f"{b}B"
    elif b < 1024 * 1024:
        return f"{b / 1024:.1f}KB"
    else:
        return f"{b / (1024 * 1024):.1f}MB"


@app.route("/")
def index():
    status = f"显卡: {GPU_NAME} ({GPU_MEM}GB)"
    if AI_AVAILABLE:
        status += " | AI引擎: 可用"
    else:
        status += " | AI引擎: 不可用 (仅轻量模式)"
    return render_template_string(HTML, status=status, ai_available=AI_AVAILABLE)


@app.route("/upscale", methods=["POST"])
def upscale():
    f = request.files.get("image")
    if not f:
        return jsonify({"success": False, "error": "未上传图片"}), 400

    scale = int(request.form.get("scale", 4))
    engine = request.form.get("engine", "lanczos")
    model = request.form.get("model", "通用照片")
    fmt = request.form.get("format", "PNG")
    quality = int(request.form.get("quality", 95))

    try:
        img_bytes = f.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        return jsonify({"success": False, "error": f"无法识别图片格式: {e}"}), 400

    w, h = image.size
    if w < 32 or h < 32:
        return jsonify({"success": False, "error": "图片太小 (最小 32x32)"}), 400

    # Original size
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    orig_bytes = buf.tell()

    t0 = time.time()

    try:
        if engine == "ai" and AI_AVAILABLE:
            result = RealESRGANEngine.upscale(image, scale, model)
            engine_name = RealESRGANEngine.name
        else:
            result = LanczosEngine.upscale(image, scale)
            engine_name = LanczosEngine.name
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        return jsonify({"success": False, "error": f"放大失败: {e}", "traceback": tb}), 500

    elapsed = f"{time.time() - t0:.1f}秒"

    # Save result
    save_ext = {"PNG": "png", "JPEG": "jpg", "WebP": "webp"}[fmt]
    save_kwargs = {}
    if fmt == "JPEG":
        save_kwargs = {"quality": quality, "optimize": True}
    elif fmt == "WebP":
        save_kwargs = {"quality": 95}

    out_buf = io.BytesIO()
    result.save(out_buf, format=fmt, **save_kwargs)
    result_bytes = out_buf.tell()

    # Save to disk for download
    uid = f.name.rsplit(".", 1)[0] if "." in (f.name or "") else "image"
    tmp_name = f"{uid}_upscaled_{scale}x.{save_ext}"
    tmp_path = UPLOAD_DIR / tmp_name
    result.save(tmp_path, format=fmt, **save_kwargs)

    # Also save a copy for inline display (PNG for browser)
    display_name = f"{uid}_display_{scale}x.png"
    display_path = UPLOAD_DIR / display_name
    result.save(display_path, format="PNG")

    rw, rh = result.size

    return jsonify({
        "success": True,
        "orig_size": f"{w}×{h}",
        "orig_bytes": fmt_size(orig_bytes),
        "result_size": f"{rw}×{rh}",
        "result_bytes": fmt_size(result_bytes),
        "scale": scale,
        "elapsed": elapsed,
        "engine": engine_name,
        "result_url": f"/result/{display_name}",
        "download_url": f"/download/{tmp_name}",
    })


@app.route("/result/<name>")
def result_image(name):
    return send_file(UPLOAD_DIR / name, mimetype="image/png")


@app.route("/download/<name>")
def download_file(name):
    return send_file(UPLOAD_DIR / name, as_attachment=True)


if __name__ == "__main__":
    print("=" * 60)
    print("  高清无损放大软件 (Flask)")
    print(f"  GPU: {GPU_NAME} ({GPU_MEM}GB)" if GPU_MEM > 0 else "  GPU: CPU模式")
    print(f"  AI引擎: {'可用' if AI_AVAILABLE else '不可用'}")
    print("  本地地址: http://127.0.0.1:7860")
    print("=" * 60)
    app.run(host="127.0.0.1", port=7860, debug=False)
