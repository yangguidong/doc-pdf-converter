"""
3D相机多角度图像生成器
基于 Qwen-Image-Edit-2511 + Multi-Angles LoRA
免费方案: 通过 Gradio Client 调用 HuggingFace Space 的公开 API
"""
import os
import json
import base64
import io
import warnings
from pathlib import Path

from PIL import Image

warnings.filterwarnings("ignore")

# ============================================================
# 配置: 可用的免费后端列表
# ============================================================

BACKENDS = {
    "HF Space (免费, 推荐)": {
        "type": "gradio_space",
        "space": "multimodalart/qwen-image-multiple-angles-3d-camera",
    },
    "Colab 自建后端 (免费)": {
        "type": "custom_url",
        "description": "运行 colab_backend.ipynb 获取 URL",
    },
}

# ============================================================
# 相机角度映射表
# ============================================================

AZIMUTH_MAP = {
    0: "front view",
    45: "front-right quarter view",
    90: "right side view",
    135: "back-right quarter view",
    180: "back view",
    225: "back-left quarter view",
    270: "left side view",
    315: "front-left quarter view",
}

ELEVATION_MAP = {
    -30: "low-angle shot",
    0: "eye-level shot",
    30: "elevated shot",
    60: "high-angle shot",
}

DISTANCE_MAP = {
    0.6: "close-up",
    1.0: "medium shot",
    1.8: "wide shot",
}

AZIMUTH_STEPS = list(AZIMUTH_MAP.keys())
ELEVATION_STEPS = list(ELEVATION_MAP.keys())
DISTANCE_STEPS = list(DISTANCE_MAP.keys())


# ============================================================
# 提示词构建
# ============================================================

def snap_to_nearest(value, options):
    """将连续值吸附到最近的离散选项"""
    return min(options, key=lambda x: abs(x - value))


def build_camera_prompt(azimuth: float, elevation: float, distance: float) -> str:
    """
    根据相机参数生成 LoRA 提示词
    格式: <sks> {方位角描述} {仰角描述} {距离描述}
    """
    az = snap_to_nearest(azimuth, AZIMUTH_STEPS)
    el = snap_to_nearest(elevation, ELEVATION_STEPS)
    dist = snap_to_nearest(distance, DISTANCE_STEPS)

    return f"<sks> {AZIMUTH_MAP[az]} {ELEVATION_MAP[el]} {DISTANCE_MAP[dist]}"


# ============================================================
# 推理: 通过 Gradio Client 调用 HF Space (免费)
# ============================================================

def infer_via_gradio_space(
    image: Image.Image,
    azimuth: float,
    elevation: float,
    distance: float,
    seed: int = 0,
    guidance_scale: float = 1.0,
    num_inference_steps: int = 4,
    progress=None,
):
    """通过 gradio_client 调用公开的 HuggingFace Space"""
    from gradio_client import Client, handle_file

    prompt = build_camera_prompt(azimuth, elevation, distance)

    if progress is not None:
        progress(0.1, desc="连接 HF Space...")

    client = Client("multimodalart/qwen-image-multiple-angles-3d-camera")

    if progress is not None:
        progress(0.2, desc="保存图片...")

    # 保存图片到临时文件
    tmp_path = Path("_temp_input.png")
    image.convert("RGB").save(tmp_path, format="PNG")

    try:
        if progress is not None:
            progress(0.3, desc="提交推理请求...")

        # 调用 Space 的推理函数
        # Space 的接口: image, azimuth, elevation, distance, seed, randomize_seed,
        #               guidance_scale, num_inference_steps, height, width
        result = client.predict(
            handle_file(str(tmp_path)),  # image
            azimuth,                      # azimuth
            elevation,                    # elevation
            distance,                     # distance
            seed,                         # seed
            True,                         # randomize_seed
            guidance_scale,               # guidance_scale
            num_inference_steps,          # num_inference_steps
            1024,                         # height
            1024,                         # width
            api_name="/infer_camera_edit",
        )

        if progress is not None:
            progress(0.8, desc="处理结果...")

        # result 可能是文件路径或图片数据
        if isinstance(result, str):
            result_img = Image.open(result)
        elif isinstance(result, Image.Image):
            result_img = result
        elif isinstance(result, (list, tuple)):
            # Space 可能返回多个值 (image, seed, prompt)
            result_img = result[0]
            if isinstance(result_img, str):
                result_img = Image.open(result_img)
        else:
            result_img = result

        if progress is not None:
            progress(1.0, desc="完成!")

        return result_img, prompt

    finally:
        # 清理临时文件
        try:
            tmp_path.unlink()
        except OSError:
            pass


# ============================================================
# 推理: 自定义后端 URL (Colab 等)
# ============================================================

def infer_via_custom_url(
    backend_url: str,
    image: Image.Image,
    azimuth: float,
    elevation: float,
    distance: float,
    seed: int = 0,
    guidance_scale: float = 1.0,
    num_inference_steps: int = 4,
    progress=None,
):
    """通过 HTTP 调用自定义后端 (如 Colab)"""
    import requests

    prompt = build_camera_prompt(azimuth, elevation, distance)

    if progress is not None:
        progress(0.1, desc="编码图片...")

    # 图片转 base64
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="PNG")
    img_b64 = base64.b64encode(buf.getvalue()).decode()

    if progress is not None:
        progress(0.3, desc="发送请求...")

    url = backend_url.rstrip("/") + "/api/generate"
    resp = requests.post(
        url,
        json={
            "image_b64": img_b64,
            "azimuth": azimuth,
            "elevation": elevation,
            "distance": distance,
            "seed": seed,
            "guidance_scale": guidance_scale,
            "num_inference_steps": num_inference_steps,
        },
        timeout=300,
    )

    if progress is not None:
        progress(0.7, desc="解码结果...")

    if resp.status_code != 200:
        raise RuntimeError(f"后端返回错误 ({resp.status_code}): {resp.text}")

    data = resp.json()
    result_img = Image.open(io.BytesIO(base64.b64decode(data["image_b64"])))

    if progress is not None:
        progress(1.0, desc="完成!")

    return result_img, prompt


# ============================================================
# GPU 检测 (用于显示信息)
# ============================================================

def detect_gpu():
    """检测 GPU, 返回型号和显存"""
    try:
        import torch
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            mem = round(torch.cuda.get_device_properties(0).total_mem / (1024**3), 1)
            return name, mem
    except Exception:
        pass

    # 尝试 nvidia-smi
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

    return "未检测到", 0


GPU_NAME, GPU_MEM = detect_gpu()


# ============================================================
# Three.js 3D 相机控制组件
# ============================================================

THREE_JS_CDN = "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"


# 缓存本地 Three.js 内容 (启动时加载, 避免 CDN 被墙)
_THREE_JS_CONTENT = None

def _load_three_js():
    """加载本地 Three.js 文件内容"""
    global _THREE_JS_CONTENT
    if _THREE_JS_CONTENT is not None:
        return _THREE_JS_CONTENT
    js_path = Path(__file__).parent / "three.min.js"
    if js_path.exists():
        _THREE_JS_CONTENT = js_path.read_text(encoding="utf-8")
    else:
        # 兜底: 用 unpkg CDN (国内可用)
        _THREE_JS_CONTENT = THREE_JS_CDN
    return _THREE_JS_CONTENT


def get_3d_camera_html(value=None, image_url=None):
    """生成 Three.js 3D 相机控制的 HTML"""
    if value is None:
        value = {"azimuth": 0, "elevation": 0, "distance": 1.0}

    val_json = json.dumps(value)
    img_json = json.dumps(image_url)

    three_js = _load_three_js()
    if three_js.endswith(".js"):
        # CDN URL - use script tag
        three_tag = f'<script src="{three_js}"></script>'
    else:
        # Inline content
        three_tag = f"<script>{three_js}</script>"

    # 用占位符避免 f-string 与 JavaScript {} 冲突
    html = """__THREE_JS_TAG__
<div id="c3d-root" style="width:100%;height:420px;position:relative;background:#1a1a2e;border-radius:12px;overflow:hidden;">
<div id="c3d-loading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#aaa;font-family:sans-serif;font-size:16px;z-index:20;text-align:center;">Loading 3D Viewport...<br><span style="font-size:12px;color:#666;">if stuck, check network</span></div>
<div id="c3d-overlay" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);padding:8px 16px;border-radius:8px;font-family:Consolas,monospace;font-size:13px;color:#0f8;white-space:nowrap;z-index:10;pointer-events:none;"></div>
<div style="position:absolute;top:10px;right:14px;font-family:sans-serif;font-size:11px;color:#999;z-index:10;text-align:right;line-height:1.7;pointer-events:none;">Green: Azimuth<br>Pink: Elevation<br>Orange: Distance</div>
</div>
<script>
(function(){
var root=document.getElementById('c3d-root'),ov=document.getElementById('c3d-overlay');
var _v=__VAL__;
var _img=__IMG__;
(function init(){
if(typeof THREE==='undefined'){setTimeout(init,100);return;}
document.getElementById('c3d-loading').style.display='none';
var S=new THREE.Scene();S.background=new THREE.Color(0x1a1a2e);
var C=new THREE.PerspectiveCamera(48,root.clientWidth/root.clientHeight,0.1,100);
C.position.set(4.5,3.2,4.5);C.lookAt(0,0.7,0);
var R=new THREE.WebGLRenderer({antialias:true});R.setSize(root.clientWidth,root.clientHeight);R.setPixelRatio(Math.min(devicePixelRatio,2));
root.insertBefore(R.domElement,ov);
S.add(new THREE.AmbientLight(0xffffff,0.55));
var dl=new THREE.DirectionalLight(0xffffff,0.55);dl.position.set(5,10,5);S.add(dl);
S.add(new THREE.GridHelper(8,16,0x335,0x224));
var CTR=new THREE.Vector3(0,0.75,0),BD=1.6,AR=2.4,ER=1.8;
var aSteps=[0,45,90,135,180,225,270,315],eSteps=[-30,0,30,60],dSteps=[0.6,1.0,1.8];
var aN={0:'front view',45:'front-right quarter view',90:'right side view',135:'back-right quarter view',180:'back view',225:'back-left quarter view',270:'left side view',315:'front-left quarter view'};
var eN={'-30':'low-angle shot','0':'eye-level shot','30':'elevated shot','60':'high-angle shot'};
var dN={'0.6':'close-up','1.0':'medium shot','1.8':'wide shot'};
var snap=function(v,s){return s.reduce(function(a,b){return Math.abs(b-v)<Math.abs(a-v)?b:a;});};
var az=_v.azimuth||0,el=_v.elevation||0,dist=_v.distance||1.0;

var pMat=new THREE.MeshBasicMaterial({map:null,side:THREE.DoubleSide,transparent:true,opacity:0.95});
var tPlane=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),pMat);tPlane.position.copy(CTR);S.add(tPlane);
function mkPh(){
var c=document.createElement('canvas');c.width=256;c.height=256;var x=c.getContext('2d');
x.fillStyle='#2a2a3e';x.fillRect(0,0,256,256);x.fillStyle='#fc9';x.beginPath();x.arc(128,128,70,0,Math.PI*2);x.fill();
x.fillStyle='#333';x.beginPath();x.arc(100,108,9,0,Math.PI*2);x.arc(156,108,9,0,Math.PI*2);x.fill();
x.strokeStyle='#333';x.lineWidth=3;x.beginPath();x.arc(128,130,30,0.2,Math.PI-0.2);x.stroke();
x.fillStyle='#adf';x.font='14px sans-serif';x.textAlign='center';x.fillText('Drag handles',128,195);x.fillText('to set camera angle',128,218);
return new THREE.CanvasTexture(c);
}
pMat.map=mkPh();pMat.needsUpdate=true;
function updTex(url){
if(!url){pMat.map=mkPh();pMat.needsUpdate=true;return;}
new THREE.TextureLoader().load(url,function(tex){tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;pMat.map=tex;pMat.needsUpdate=true;
var img=tex.image;if(img&&img.width&&img.height){var asp=img.width/img.height,mx=1.5;var pw=mx,ph=mx/asp;if(asp<1){ph=mx;pw=mx*asp;}S.remove(tPlane);tPlane.geometry.dispose();tPlane=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),pMat);tPlane.position.copy(CTR);S.add(tPlane);}
},undefined,function(){});
}
if(_img)updTex(_img);

var camG=new THREE.Group();
var bM=new THREE.MeshStandardMaterial({color:0x69c,metalness:0.5,roughness:0.3});
camG.add(new THREE.Mesh(new THREE.BoxGeometry(0.3,0.22,0.38),bM));
var lens=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.11,0.18,16),new THREE.MeshStandardMaterial({color:0x69c,metalness:0.5,roughness:0.3}));
lens.rotation.x=Math.PI/2;lens.position.z=0.26;camG.add(lens);S.add(camG);

var aRing=new THREE.Mesh(new THREE.TorusGeometry(AR,0.04,16,64),new THREE.MeshStandardMaterial({color:0x0f8,emissive:0x0f8,emissiveIntensity:0.3}));
aRing.rotation.x=Math.PI/2;aRing.position.y=0.05;S.add(aRing);
var aH=new THREE.Mesh(new THREE.SphereGeometry(0.18,16,16),new THREE.MeshStandardMaterial({color:0x0f8,emissive:0x0f8,emissiveIntensity:0.5}));
aH.userData.type='azimuth';S.add(aH);

var arc=[];for(var i=0;i<=32;i++){var a=THREE.MathUtils.degToRad(-30+90*i/32);arc.push(new THREE.Vector3(-0.8,ER*Math.sin(a)+CTR.y,ER*Math.cos(a)));}
var eArc=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),32,0.04,8,false),new THREE.MeshStandardMaterial({color:0xf69,emissive:0xf69,emissiveIntensity:0.3}));
S.add(eArc);
var eH=new THREE.Mesh(new THREE.SphereGeometry(0.18,16,16),new THREE.MeshStandardMaterial({color:0xf69,emissive:0xf69,emissiveIntensity:0.5}));
eH.userData.type='elevation';S.add(eH);

var dLG=new THREE.BufferGeometry();var dL=new THREE.Line(dLG,new THREE.LineBasicMaterial({color:0xfa0}));S.add(dL);
var dH=new THREE.Mesh(new THREE.SphereGeometry(0.18,16,16),new THREE.MeshStandardMaterial({color:0xfa0,emissive:0xfa0,emissiveIntensity:0.5}));
dH.userData.type='distance';S.add(dH);

function upPos(){
var d=BD*dist,aR=THREE.MathUtils.degToRad(az),eR=THREE.MathUtils.degToRad(el);
var cx=d*Math.sin(aR)*Math.cos(eR),cy=d*Math.sin(eR)+CTR.y,cz=d*Math.cos(aR)*Math.cos(eR);
camG.position.set(cx,cy,cz);camG.lookAt(CTR);
aH.position.set(AR*Math.sin(aR),0.05,AR*Math.cos(aR));
eH.position.set(-0.8,ER*Math.sin(eR)+CTR.y,ER*Math.cos(eR));
var od=d-0.5;dH.position.set(od*Math.sin(aR)*Math.cos(eR),od*Math.sin(eR)+CTR.y,od*Math.cos(aR)*Math.cos(eR));
dLG.setFromPoints([camG.position.clone(),CTR.clone()]);
var aS=snap(az,aSteps),eS=snap(el,eSteps),dS=snap(dist,dSteps);
ov.textContent='<sks> '+aN[aS]+' '+eN[String(eS)]+' '+dN[String(dS)];
}
function emit(){
var aS=snap(az,aSteps),eS=snap(el,eSteps),dS=snap(dist,dSteps);
window._c3dVal={azimuth:aS,elevation:eS,distance:dS};
root.dispatchEvent(new CustomEvent('c3d-change',{detail:window._c3dVal}));
}

var rc=new THREE.Raycaster(),ms=new THREE.Vector2();var drag=false,tgt=null,dsY=0,dsD=1.0;var hp=new THREE.Vector3(),hdls=[aH,eH,dH];
function gM(e){var r=R.domElement.getBoundingClientRect();ms.x=((e.clientX-r.left)/r.width)*2-1;ms.y=-((e.clientY-r.top)/r.height)*2+1;}
function onDn(e){gM(e.touches?e.touches[0]:e);rc.setFromCamera(ms,C);var h=rc.intersectObjects(hdls);if(h.length>0){drag=true;tgt=h[0].object;tgt.material.emissiveIntensity=1;tgt.scale.setScalar(1.3);dsY=ms.y;dsD=dist;R.domElement.style.cursor='grabbing';}}
function onMv(e){if(e.touches)e.preventDefault();gM(e.touches?e.touches[0]:e);if(drag&&tgt){rc.setFromCamera(ms,C);var t=tgt.userData.type;if(t==='azimuth'){var p=new THREE.Plane(new THREE.Vector3(0,1,0),-0.05);if(rc.ray.intersectPlane(p,hp)){az=THREE.MathUtils.radToDeg(Math.atan2(hp.x,hp.z));if(az<0)az+=360;}}else if(t==='elevation'){var p=new THREE.Plane(new THREE.Vector3(1,0,0),-0.8);if(rc.ray.intersectPlane(p,hp)){el=THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(Math.atan2(hp.y-CTR.y,hp.z)),-30,60);}}else if(t==='distance'){dist=THREE.MathUtils.clamp(dsD-(ms.y-dsY)*1.5,0.6,1.8);}upPos();}else{rc.setFromCamera(ms,C);var h=rc.intersectObjects(hdls);hdls.forEach(function(x){x.material.emissiveIntensity=0.5;x.scale.setScalar(1);});if(h.length>0){h[0].object.material.emissiveIntensity=0.8;h[0].object.scale.setScalar(1.12);R.domElement.style.cursor='grab';}else R.domElement.style.cursor='default';}}
function onUp(e){if(tgt){tgt.material.emissiveIntensity=0.5;tgt.scale.setScalar(1);var tA=snap(az,aSteps),tE=snap(el,eSteps),tD=snap(dist,dSteps);var sA=az,sE=el,sD=dist,st=Date.now();(function anim(){var t=Math.min((Date.now()-st)/200,1);var e=1-Math.pow(1-t,3);var d=tA-sA;if(d>180)d-=360;if(d<-180)d+=360;az=sA+d*e;if(az<0)az+=360;if(az>=360)az-=360;el=sE+(tE-sE)*e;dist=sD+(tD-sD)*e;upPos();if(t<1)requestAnimationFrame(anim);else emit();})();}drag=false;tgt=null;R.domElement.style.cursor='default';}
R.domElement.addEventListener('mousedown',onDn);R.domElement.addEventListener('mousemove',onMv);R.domElement.addEventListener('mouseup',onUp);R.domElement.addEventListener('mouseleave',onUp);
R.domElement.addEventListener('touchstart',onDn,{passive:false});R.domElement.addEventListener('touchmove',onMv,{passive:false});R.domElement.addEventListener('touchend',onUp,{passive:false});R.domElement.addEventListener('touchcancel',onUp,{passive:false});
upPos();window._c3dVal={azimuth:snap(az,aSteps),elevation:snap(el,eSteps),distance:snap(dist,dSteps)};
(function render(){requestAnimationFrame(render);R.render(S,C);})();
new ResizeObserver(function(){C.aspect=root.clientWidth/root.clientHeight;C.updateProjectionMatrix();R.setSize(root.clientWidth,root.clientHeight);}).observe(root);
window._c3dSetVal=function(v){if(v){az=v.azimuth!=null?v.azimuth:az;el=v.elevation!=null?v.elevation:el;dist=v.distance!=null?v.distance:dist;upPos();window._c3dVal={azimuth:snap(az,aSteps),elevation:snap(el,eSteps),distance:snap(dist,dSteps)};}};
window._c3dSetImg=function(url){updTex(url);};
})();
})();
</script>"""

    return html.replace("__THREE_JS_TAG__", three_tag)\
               .replace("__VAL__", val_json)\
               .replace("__IMG__", img_json)


# ============================================================
# Gradio UI
# ============================================================

CSS = """
footer { display: none !important; }
.gradio-container { max-width: 1300px !important; }
"""


def create_ui():
    import gradio as gr

    with gr.Blocks(
        css=CSS,
        theme=gr.themes.Soft(),
        title="3D相机多角度图像生成器",
    ) as demo:

        # ---- 头部 ----
        emoji = "✅" if GPU_MEM >= 8 else ("⚠️" if GPU_MEM > 0 else "ℹ️")
        gr.Markdown(f"""
        # 🎬 3D 相机多角度图像生成器
        上传图片 → 拖拽 3D 手柄选角度 → AI 生成新视角图像。**完全免费!**

        {emoji} 检测到: **{GPU_NAME}** ({GPU_MEM}GB) | 推理由免费云端处理，不吃本地显存
        """)

        # ---- 后端选择 ----
        with gr.Row():
            backend_type = gr.Radio(
                choices=list(BACKENDS.keys()),
                value=list(BACKENDS.keys())[0],
                label="🖥️ 推理后端",
                info="HF Space: 直接调用公开的免费 Space | Colab: 需要先运行 colab_backend.ipynb",
            )
            custom_url = gr.Textbox(
                label="自定义后端 URL (选 Colab 时填写)",
                placeholder="https://xxx.ngrok-free.app",
                visible=False,
                interactive=True,
            )

        def toggle_url_input(choice):
            if "Colab" in choice:
                return gr.update(visible=True)
            return gr.update(visible=False)

        backend_type.change(
            fn=toggle_url_input,
            inputs=[backend_type],
            outputs=[custom_url],
        )

        # ---- 主布局 ----
        with gr.Row(equal_height=False):
            # 左栏: 输入
            with gr.Column(scale=1, min_width=420):
                image_input = gr.Image(label="📤 上传图片", type="pil", height=260)

                gr.Markdown("### 🎮 3D 相机控制")
                gr.Markdown("*拖拽彩色手柄: &nbsp; 🟢方位角 &nbsp; 🌸仰角 &nbsp; 🟠距离*")

                camera_3d_html = gr.HTML(
                    value=get_3d_camera_html(),
                    elem_id="c3d-container",
                )

                camera_state = gr.State({"azimuth": 0, "elevation": 0, "distance": 1.0})

                # 读取 3D 组件的 JS 变量
                def read_camera_js():
                    return None  # 通过 JS 更新

                run_btn = gr.Button("🚀 生成", variant="primary", size="lg")

                gr.Markdown("### 🎚️ 滑块微调")
                azimuth_slider = gr.Slider(
                    label="方位角", minimum=0, maximum=315, step=45, value=0,
                    info="0°=正面 | 90°=右侧 | 180°=背面 | 270°=左侧",
                )
                elevation_slider = gr.Slider(
                    label="仰角", minimum=-30, maximum=60, step=30, value=0,
                    info="-30°=仰拍 | 0°=平视 | 30°=俯视 | 60°=高角度",
                )
                distance_slider = gr.Slider(
                    label="距离", minimum=0.6, maximum=1.8, step=0.4, value=1.0,
                    info="0.6=特写 | 1.0=中景 | 1.8=远景",
                )
                prompt_preview = gr.Textbox(
                    label="提示词",
                    value="<sks> front view eye-level shot medium shot",
                    interactive=False,
                )

            # 右栏: 输出
            with gr.Column(scale=1, min_width=420):
                image_output = gr.Image(label="📥 生成结果", type="pil", height=400)

                with gr.Accordion("⚙️ 高级设置", open=False):
                    seed_input = gr.Number(label="Seed (0=随机)", value=0, precision=0)
                    guidance_scale = gr.Slider(
                        label="引导系数", minimum=1.0, maximum=10.0, step=0.5, value=1.0
                    )
                    num_steps = gr.Slider(
                        label="推理步数", minimum=1, maximum=20, step=1, value=4
                    )

                gr.Markdown("""
                ---
                ### 📋 使用说明
                **方式一 (推荐):** 选择 "HF Space" → 上传图片 → 拖拽手柄 → 点击生成
                > 免费, 无需任何配置, 推理在 HuggingFace 云端处理

                **方式二:** 选择 "Colab 自建后端" → 运行 `colab_backend.ipynb` → 粘贴 URL → 生成
                > 免费, 用自己的 Google Colab GPU, 适合批量使用

                **关于速度:** HF Space 冷启动约 30-60 秒，热启动约 5-10 秒
                """)

        # ============================================================
        # 事件处理
        # ============================================================

        def update_prompt(azimuth, elevation, distance):
            return build_camera_prompt(azimuth, elevation, distance)

        def sync_sliders_to_3d(azimuth, elevation, distance):
            """滑块 → 3D 组件"""
            v = {
                "azimuth": int(azimuth),
                "elevation": int(elevation),
                "distance": float(distance),
            }
            return v, build_camera_prompt(azimuth, elevation, distance)

        def handle_generate(
            image, azimuth, elevation, distance, seed, guidance, steps,
            backend_choice, custom_url_val, progress=gr.Progress(),
        ):
            if image is None:
                raise gr.Error("请先上传图片")

            backend = BACKENDS[backend_choice]

            if backend["type"] == "gradio_space":
                return infer_via_gradio_space(
                    image, azimuth, elevation, distance,
                    seed=int(seed), guidance_scale=guidance,
                    num_inference_steps=int(steps), progress=progress,
                )
            elif backend["type"] == "custom_url":
                if not custom_url_val or not custom_url_val.strip():
                    raise gr.Error(
                        "请先运行 colab_backend.ipynb 获取后端 URL，"
                        "然后粘贴到'自定义后端 URL'输入框中"
                    )
                return infer_via_custom_url(
                    custom_url_val.strip(), image, azimuth, elevation, distance,
                    seed=int(seed), guidance_scale=guidance,
                    num_inference_steps=int(steps), progress=progress,
                )

        # 滑块变化 → 更新提示词
        for s in [azimuth_slider, elevation_slider, distance_slider]:
            s.change(
                fn=update_prompt,
                inputs=[azimuth_slider, elevation_slider, distance_slider],
                outputs=[prompt_preview],
            )

        # 滑块释放 → 同步到 3D 组件
        for s in [azimuth_slider, elevation_slider, distance_slider]:
            s.release(
                fn=sync_sliders_to_3d,
                inputs=[azimuth_slider, elevation_slider, distance_slider],
                outputs=[camera_state, prompt_preview],
            ).then(
                fn=None,
                js="(v)=>{if(window._c3dSetVal)window._c3dSetVal(v);}",
                inputs=[camera_state],
                outputs=None,
            )

        # 生成按钮
        run_btn.click(
            fn=handle_generate,
            inputs=[
                image_input, azimuth_slider, elevation_slider, distance_slider,
                seed_input, guidance_scale, num_steps, backend_type, custom_url,
            ],
            outputs=[image_output, prompt_preview],
        )


        # 定期从 3D 组件同步值到滑块 (通过 JS 轮询)
        # 使用一个隐藏按钮来触发同步
        def sync_3d_to_sliders(camera_val):
            """3D 组件 → 滑块"""
            if camera_val and isinstance(camera_val, dict):
                az = camera_val.get("azimuth", 0)
                el = camera_val.get("elevation", 0)
                dist = camera_val.get("distance", 1.0)
                return az, el, dist, build_camera_prompt(az, el, dist)
            return 0, 0, 1.0, "<sks> front view eye-level shot medium shot"

        # 同步按钮 (JS 定期点击)
        sync_btn = gr.Button("sync", visible=False, elem_id="c3d-sync-btn")
        sync_btn.click(
            fn=None,
            js="()=>window._c3dVal||{azimuth:0,elevation:0,distance:1.0}",
            outputs=None,
        ).then(
            fn=sync_3d_to_sliders,
            inputs=[camera_state],
            outputs=[azimuth_slider, elevation_slider, distance_slider, prompt_preview],
        )

        # 图片上传 → 更新 3D 视口中的纹理
        def update_3d_image(image):
            if image is None:
                return gr.update(value=get_3d_camera_html(value={"azimuth": 0, "elevation": 0, "distance": 1.0}))
            buf = io.BytesIO()
            image.convert("RGB").save(buf, format="PNG")
            data_url = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"
            return gr.update(
                value=get_3d_camera_html(
                    value={"azimuth": 0, "elevation": 0, "distance": 1.0},
                    image_url=data_url,
                )
            )

        image_input.upload(
            fn=update_3d_image,
            inputs=[image_input],
            outputs=[camera_3d_html],
        )
        image_input.clear(
            fn=lambda: gr.update(value=get_3d_camera_html()),
            outputs=[camera_3d_html],
        )

    return demo


# ============================================================
# 启动入口
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  3D Camera Multi-Angle Image Generator")
    print("  Based on Qwen-Image-Edit-2511 + Multi-Angles LoRA")
    print(f"  GPU: {GPU_NAME} ({GPU_MEM}GB)")
    print("  Inference: Free Cloud (HF Space / Colab)")
    print("  Cost: Completely Free")
    print("=" * 60)

    demo = create_ui()
    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=True,
        show_error=True,
    )
