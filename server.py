"""
Word-PDF web converter — Flask backend.
Usage: py server.py
Then open http://127.0.0.1:5000 in your browser.
"""

import os
import sys
import tempfile
from pathlib import Path
from urllib.parse import quote
from flask import Flask, request, send_file, render_template_string

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uuid
from doc_pdf_converter import word_to_pdf, pdf_to_word, image_convert, IMAGE_FORMATS

app = Flask(__name__)
UPLOAD_DIR = Path(tempfile.gettempdir()) / "doc_pdf_converter"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Word ↔ PDF 互转</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    background: #fafaf9; color: #1a1a1a; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .card {
    background: #fff; border: 1px solid #e5e5e5; border-radius: 8px;
    padding: 48px; width: 100%; max-width: 520px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
  }
  h1 { font-size: 1.6rem; font-weight: 600; text-align: center; margin-bottom: 8px; letter-spacing: -0.02em; }
  .sub { text-align: center; color: #6b6b6b; font-size: 0.9rem; margin-bottom: 32px; }

  .dropzone {
    border: 2px dashed #d4d4d4; border-radius: 6px; padding: 48px 24px;
    text-align: center; cursor: pointer; transition: all .2s;
    margin-bottom: 24px; position: relative;
  }
  .dropzone:hover, .dropzone.drag { border-color: #1a1a1a; background: #fafaf9; }
  .dropzone input { display: none; }
  .dropzone__icon { font-size: 2.4rem; margin-bottom: 12px; }
  .dropzone__text { font-size: 0.95rem; color: #6b6b6b; }
  .dropzone__hint { font-size: 0.78rem; color: #aaa; margin-top: 6px; }

  .file-info {
    display: none; align-items: center; gap: 12px;
    padding: 12px 16px; background: #f5f5f4; border-radius: 6px;
    margin-bottom: 24px;
  }
  .file-info.show { display: flex; }
  .file-info__name { flex: 1; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-info__remove { cursor: pointer; color: #999; font-size: 1.2rem; line-height: 1; border: none; background: none; }
  .file-info__remove:hover { color: #1a1a1a; }

  .dir-badge {
    display: inline-block; padding: 2px 10px; font-size: 0.72rem;
    background: #e5e5e5; border-radius: 999px; margin-left: 4px;
  }
  .dir-badge.docx { background: #dbeafe; color: #1e40af; }
  .dir-badge.pdf  { background: #fee2e2; color: #991b1b; }
  .dir-badge.img  { background: #d1fae5; color: #065f46; }

  .btn {
    width: 100%; padding: 14px; border: none; border-radius: 6px;
    font-size: 1rem; font-weight: 500; cursor: pointer; transition: all .2s;
    font-family: inherit; letter-spacing: -0.01em;
  }
  .btn--convert { background: #1a1a1a; color: #fafaf9; }
  .btn--convert:hover { background: #333; }
  .btn--convert:disabled { background: #ccc; cursor: not-allowed; }
  .retry-link { display: none; text-align: center; margin-top: 12px; }
  .retry-link.show { display: block; }
  .retry-link a { color: #6b6b6b; font-size: 0.85rem; cursor: pointer; text-decoration: underline; }
  .retry-link a:hover { color: #1a1a1a; }

  .msg { text-align: center; font-size: 0.88rem; margin-top: 16px; min-height: 22px; }
  .msg.ok   { color: #16a34a; }
  .msg.err  { color: #dc2626; }
  .msg.info { color: #6b6b6b; }

  .progress-wrap { display: none; margin-bottom: 20px; }
  .progress-wrap.show { display: block; }
  .progress-stage {
    font-size: 0.82rem; color: #6b6b6b; text-align: center;
    margin-bottom: 8px; transition: color .3s;
  }
  .progress-stage.active { color: #1a1a1a; font-weight: 500; }
  .progress-stage.done { color: #16a34a; }
  .progress-bar {
    width: 100%; height: 6px; background: #e5e5e5; border-radius: 3px;
    overflow: hidden;
  }
  .progress-bar__fill {
    height: 100%; width: 0%; background: #1a1a1a; border-radius: 3px;
    transition: width .4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .progress-bar__fill.done { background: #16a34a; }
  .progress-pct { text-align: center; font-size: 0.78rem; color: #6b6b6b; margin-top: 6px; }
</style>
</head>
<body>

<div class="card">
  <h1>文档 & 图片互转工具</h1>
  <p class="sub">支持 Word / PDF / 图片互相转换，拖拽或点击上传</p>

  <div class="dropzone" id="dropzone">
    <div class="dropzone__icon">📂</div>
    <div class="dropzone__text">点击选择文件，或拖拽到此处</div>
    <div class="dropzone__hint">支持 .docx / .pdf / .png / .jpg / .webp 等</div>
    <input type="file" id="fileInput" accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tiff,.tif">
  </div>

  <div class="file-info" id="fileInfo">
    <span class="file-info__name" id="fileName"></span>
    <span class="dir-badge" id="dirBadge"></span>
    <button class="file-info__remove" id="removeFile" title="移除">&times;</button>
  </div>

  <div class="progress-wrap" id="progressWrap">
    <div class="progress-stage" id="progressStage">准备中...</div>
    <div class="progress-bar">
      <div class="progress-bar__fill" id="progressFill"></div>
    </div>
    <div class="progress-pct" id="progressPct">0%</div>
  </div>

  <button class="btn btn--convert" id="convertBtn" disabled>开始转换</button>

  <div class="retry-link" id="retryLink">
    <a id="retryDownload">未自动下载？点击重新下载</a>
  </div>

  <div class="msg" id="msg"></div>
</div>

<script>
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const dirBadge = document.getElementById('dirBadge');
  const removeBtn = document.getElementById('removeFile');
  const convertBtn = document.getElementById('convertBtn');
  const retryLink = document.getElementById('retryLink');
  const retryDownload = document.getElementById('retryDownload');
  const progressWrap = document.getElementById('progressWrap');
  const progressStage = document.getElementById('progressStage');
  const progressFill = document.getElementById('progressFill');
  const progressPct = document.getElementById('progressPct');
  const msg = document.getElementById('msg');

  let selectedFile = null;
  let progressTimer = null;
  let lastDownloadUrl = null;
  let lastDownloadName = null;

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag');
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });
  removeBtn.addEventListener('click', clearFile);
  convertBtn.addEventListener('click', doConvert);

  const IMG_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif'];

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const isDoc = ext === 'docx' || ext === 'pdf';
    const isImg = IMG_EXTS.includes(ext);
    if (!isDoc && !isImg) { showMsg('仅支持 .docx / .pdf / 图片格式', 'err'); return; }
    selectedFile = file;
    fileName.textContent = file.name;
    if (isDoc) {
      dirBadge.textContent = ext === 'docx' ? 'Word → PDF' : 'PDF → Word';
      dirBadge.className = 'dir-badge ' + ext;
    } else {
      const out = ext === 'png' ? 'jpg' : 'png';
      dirBadge.textContent = ext.toUpperCase() + ' → ' + out.toUpperCase();
      dirBadge.className = 'dir-badge img';
    }
    fileInfo.classList.add('show');
    convertBtn.disabled = false;
    retryLink.classList.remove('show');
    msg.textContent = '';
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.classList.remove('show');
    convertBtn.disabled = true;
    retryLink.classList.remove('show');
    msg.textContent = '';
  }

  const STAGES = [
    { pct: 12,  text: '读取文件...' },
    { pct: 30,  text: '分析文档结构...' },
    { pct: 55,  text: '正在转换...' },
    { pct: 80,  text: '生成输出文件...' },
  ];

  let currentPct = 0;

  function startProgress() {
    progressWrap.classList.add('show');
    progressFill.classList.remove('done');
    progressStage.classList.remove('done');
    currentPct = 0;
    setProgress(0, '准备中...');

    // Phase 1: rapid stages
    let step = 0;
    const advance = () => {
      if (step >= STAGES.length) return;
      const s = STAGES[step];
      currentPct = s.pct;
      setProgress(s.pct, s.text);
      step++;
      if (step < STAGES.length) {
        progressTimer = setTimeout(advance, 300 + Math.random() * 400);
      } else {
        // Phase 2: slow trickle from 80% toward 95%
        progressTimer = setTimeout(trickle, 400);
      }
    };
    progressTimer = setTimeout(advance, 150);

    function trickle() {
      if (currentPct >= 95) {
        progressTimer = setTimeout(trickle, 300);
        return;
      }
      currentPct += 1 + Math.random() * 2;
      if (currentPct > 95) currentPct = 95;
      setProgress(currentPct);
      progressTimer = setTimeout(trickle, 300 + Math.random() * 400);
    }
  }

  function finishProgress(success) {
    if (progressTimer) clearTimeout(progressTimer);
    if (success) {
      setProgress(100, '转换完成！');
      progressFill.classList.add('done');
      progressStage.classList.add('done');
    } else {
      progressFill.classList.add('done');
      setTimeout(() => { progressWrap.classList.remove('show'); }, 1200);
    }
  }

  function setProgress(pct, text) {
    progressFill.style.width = pct + '%';
    progressPct.textContent = Math.round(pct) + '%';
    if (text) {
      progressStage.textContent = text;
      progressStage.classList.add('active');
    }
  }

  async function doConvert() {
    if (!selectedFile) return;
    convertBtn.disabled = true;
    retryLink.classList.remove('show');
    msg.textContent = '';

    startProgress();
    const fd = new FormData();
    fd.append('file', selectedFile);

    try {
      const res = await fetch('/convert', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }
      const data = await res.json();
      const dlUrl = data.download;
      const outName = data.filename;

      // Auto-download via hidden iframe (never blocked)
      lastDownloadUrl = dlUrl;
      lastDownloadName = outName;
      retryDownload.onclick = () => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = lastDownloadUrl;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 10000);
      };
      retryLink.classList.add('show');

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = dlUrl;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 10000);

      finishProgress(true);
      showMsg('转换完成，文件已自动下载', 'ok');
    } catch(e) {
      finishProgress(false);
      showMsg(e.message, 'err');
    } finally {
      convertBtn.disabled = false;
    }
  }

  function showMsg(text, cls) {
    msg.textContent = text;
    msg.className = 'msg ' + (cls || '');
  }

  // Paste from clipboard support
  document.addEventListener('paste', e => {
    const items = (e.clipboardData || e.clipboardData).items;
    for (const item of items) {
      if (item.kind === 'file') {
        e.preventDefault();
        handleFile(item.getAsFile());
        return;
      }
    }
  });
</script>
</body>
</html>"""


@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route("/convert", methods=["POST"])
def convert():
    file = request.files.get("file")
    if not file:
        return {"error": "未收到文件"}, 400

    ext = Path(file.filename).suffix.lower()
    is_image = ext in IMAGE_FORMATS
    is_doc = ext in (".docx", ".pdf")
    if not is_doc and not is_image:
        return {"error": "仅支持 .docx / .pdf / 图片格式"}, 400

    # Save uploaded file
    in_path = UPLOAD_DIR / f"in_{file.filename}"
    file.save(str(in_path))

    # Determine output path
    if is_image:
        out_ext = ".png" if ext != ".png" else ".jpg"
    elif ext == ".docx":
        out_ext = ".pdf"
    else:
        out_ext = ".docx"
    out_name = Path(file.filename).stem + out_ext
    out_path = UPLOAD_DIR / f"out_{out_name}"

    try:
        if is_image:
            image_convert(str(in_path), str(out_path))
        elif ext == ".docx":
            word_to_pdf(str(in_path), str(out_path))
        else:
            pdf_to_word(str(in_path), str(out_path))
    except Exception as e:
        # Clean up input
        in_path.unlink(missing_ok=True)
        return {"error": f"转换失败: {str(e)}"}, 500

    # Clean up input file
    in_path.unlink(missing_ok=True)

    # Move output to a download-accessible path with unique id
    dl_id = uuid.uuid4().hex[:12]
    dl_name = dl_id + "_" + out_name
    dl_path = UPLOAD_DIR / dl_name
    out_path.rename(dl_path)

    return {"ok": True, "download": f"/download/{quote(dl_name)}", "filename": out_name}


@app.route("/download/<path:dl_name>")
def download(dl_name):
    dl_path = UPLOAD_DIR / dl_name
    if not dl_path.exists():
        return {"error": "文件已过期，请重新转换"}, 404
    # Extract original filename
    parts = dl_name.split("_", 1)
    orig_name = parts[1] if len(parts) > 1 else dl_name
    return send_file(str(dl_path), as_attachment=True, download_name=orig_name)


if __name__ == "__main__":
    import os as _os
    port = int(_os.environ.get("PORT", 5000))
    host = _os.environ.get("HOST", "127.0.0.1")
    is_cloud = _os.environ.get("RENDER") or _os.environ.get("CLOUD")

    print(f"Starting server on {host}:{port}")

    if not is_cloud:
        import webbrowser, threading
        threading.Timer(1.5, lambda: webbrowser.open(f"http://127.0.0.1:{port}")).start()

    app.run(host=host, port=port, debug=False, threaded=False)
