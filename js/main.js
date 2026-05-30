/* ============================================
   Art Portfolio CMS v6
   — PDF text extraction + Image EXIF/color analysis
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // =====================
  // IndexedDB
  // =====================
  const DB_NAME='ArtPortfolioDB',DB_VER=2,STORE='media';
  function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VER);req.onupgradeneeded=(e)=>{if(!e.target.result.objectStoreNames.contains(STORE))e.target.result.createObjectStore(STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function dbGet(key){const db=await openDB();return new Promise(r=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(key);req.onsuccess=()=>r(req.result);req.onerror=()=>r(null);});}
  async function dbSet(key,blob){const db=await openDB();return new Promise(r=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(blob,key);tx.oncomplete=()=>r();});}
  async function dbDel(key){const db=await openDB();return new Promise(r=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=()=>r();});}
  async function dbDelPrefix(prefix){const db=await openDB();return new Promise(r=>{const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);store.getAllKeys().onsuccess=(e)=>{e.target.result.filter(k=>k.startsWith(prefix)).forEach(k=>store.delete(k));};tx.oncomplete=()=>r();});}

  // =====================
  // Default Data (with imgMeta for analyzed images)
  // =====================
  const DEFAULT_DATA={
    siteName:'Studio.',navHome:'Home',navGallery:'Works',navAbout:'About',navContact:'Contact',
    heroTitle:'Artist Name',heroSub:'Photographer / Visual Designer',aboutTitle:'About Me',
    aboutText1:'我是一名专注于视觉传达的摄影师和设计师。',aboutText2:'毕业于中央美术学院视觉传达专业。',aboutText3:'目前常驻上海，接受商业拍摄和品牌设计项目合作。',
    contactTitle:'Contact',contactDesc:'欢迎合作与项目咨询。\n可通过以下方式联系我。',
    contactEmail:'hello@artist.com',contactEmail_url:'mailto:hello@artist.com',
    contactIg:'@artist_handle',contactIg_url:'https://instagram.com/artist_handle',
    contactBe:'Behance',contactBe_url:'https://behance.net/artist',
    contactWx:'WeChat: artist_wechat',contactWx_url:'weixin://',
    photos:[],videos:[],documents:[],mediaKeys:['heroBg','aboutImg']
  };

  // =====================
  // EXIF Parser (JPEG only, custom)
  // =====================
  function parseEXIF(arrayBuffer){
    const data=new DataView(arrayBuffer);
    const result={};
    // Check JPEG SOI
    if(data.getUint16(0)!==0xFFD8)return result;
    let offset=2;
    while(offset<data.byteLength){
      if(data.getUint8(offset)!==0xFF)break;
      const marker=data.getUint8(offset+1);
      if(marker===0xE1){// APP1
        const app1Start=offset+2;
        const app1Len=data.getUint16(app1Start);
        const exifStart=app1Start+2;
        // Check "Exif\0\0"
        if(exifStart+6<=data.byteLength){
          const exifId=String.fromCharCode(data.getUint8(exifStart),data.getUint8(exifStart+1),data.getUint8(exifStart+2),data.getUint8(exifStart+3));
          if(exifId==='Exif'){
            return parseTIFF(data,exifStart+6);
          }
        }
        offset=app1Start+app1Len;
      }else if(marker===0xD8||marker===0xD9||marker===0xDA){
        break;
      }else{
        const segLen=data.getUint16(offset+2);
        offset+=2+segLen;
      }
    }
    return result;
  }

  function parseTIFF(data,tiffStart){
    const result={};
    const isLE=data.getUint16(tiffStart)===0x4949;
    function read16(o){return data.getUint16(o,isLE);}
    function read32(o){return data.getUint32(o,isLE);}
    const ifdOffset=read32(tiffStart+4);
    const ifdStart=tiffStart+ifdOffset;
    const entries=read16(ifdStart);
    const tagMap={
      0x010F:'make',0x0110:'model',0x0112:'orientation',
      0x0132:'dateTime',0x9003:'dateTimeOriginal',0x9004:'dateTimeDigitized',
      0x829A:'exposureTime',0x829D:'fNumber',0x8827:'iso',
      0x920A:'focalLength',0x9204:'focalLength35',
      0xA402:'cameraMode',
    };
    const gpsTagMap={0x0001:'gpsLatRef',0x0002:'gpsLat',0x0003:'gpsLonRef',0x0004:'gpsLon'};

    for(let i=0;i<entries;i++){
      const entryOff=ifdStart+2+i*12;
      const tag=read16(entryOff);
      const type=read16(entryOff+2);
      const count=read32(entryOff+4);
      const valOff=entryOff+8;
      let val;
      if(type===2){
        const len=Math.min(count,128);
        const bytes=[];for(let j=0;j<len&&j<4;j++)bytes.push(data.getUint8(valOff+j));if(count>4){const charOff=tiffStart+read32(valOff);for(let j=4;j<len;j++)bytes.push(data.getUint8(charOff+j-4));}
        val=String.fromCharCode(...bytes).replace(/\0.*$/,'');
      }else if(type===3&&count===1){val=read16(valOff);}
      else if(type===4&&count===1){val=read32(valOff);}
      else if(type===5&&count===1){val=read32(valOff)/read32(valOff+4);}
      else if(type===5&&count===2){val=[read32(valOff)/read32(valOff+4),read32(valOff+8)/read32(valOff+12)];}
      else{val='complex';}

      if(tagMap[tag])result[tagMap[tag]]=val;
    }

    // GPS IFD
    const gpsIfdTag=0x8825;
    for(let i=0;i<entries;i++){
      const entryOff=ifdStart+2+i*12;
      if(read16(entryOff)===gpsIfdTag&&read16(entryOff+2)===4){
        const gpsOff=tiffStart+read32(entryOff+8);
        const gpsEntries=read16(gpsOff);
        for(let j=0;j<gpsEntries;j++){
          const geOff=gpsOff+2+j*12;
          const gtag=read16(geOff);
          if(gpsTagMap[gtag]){
            result[gpsTagMap[gtag]]=read32(geOff+8)/read32(geOff+12);
          }
        }
        break;
      }
    }
    return result;
  }

  function formatEXIF(exif){
    const info={};
    if(exif.make||exif.model){info.camera=(exif.make&&exif.model)?(exif.make+' '+exif.model).replace(/\0/g,'').trim():(exif.make||exif.model).replace(/\0/g,'').trim();}
    if(exif.dateTimeOriginal||exif.dateTime){info.date=(exif.dateTimeOriginal||exif.dateTime).replace(/\0/g,'').trim();}
    if(exif.iso)info.iso='ISO '+exif.iso;
    if(exif.exposureTime&&typeof exif.exposureTime==='number'){
      const et=exif.exposureTime;
      info.shutter=et<1?('1/'+Math.round(1/et)):et.toFixed(1);
    }
    if(exif.fNumber&&typeof exif.fNumber==='number')info.aperture='f/'+exif.fNumber.toFixed(1);
    if(exif.focalLength&&typeof exif.focalLength==='number')info.focal=Math.round(exif.focalLength)+'mm';
    if(exif.focalLength35&&typeof exif.focalLength35==='number')info.focal35=Math.round(exif.focalLength35)+'mm';
    if(exif.gpsLat&&exif.gpsLon){info.gps={lat:exif.gpsLat.toFixed(4),lon:exif.gpsLon.toFixed(4)};}
    return info;
  }

  // =====================
  // Color Palette Extractor
  // =====================
  function extractColorPalette(img,count=5){
    const canvas=document.createElement('canvas');
    const size=64;canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,size,size);
    const pixels=ctx.getImageData(0,0,size,size).data;
    const colors=[];
    // Simple quantization: sample every 4th pixel, group by dominant component
    const buckets=new Map();
    for(let i=0;i<pixels.length;i+=16){
      const r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3];
      if(a<128)continue;
      // Quantize to 32 levels
      const qr=Math.round(r/32)*32,qg=Math.round(g/32)*32,qb=Math.round(b/32)*32;
      const key=`${qr},${qg},${qb}`;
      buckets.set(key,(buckets.get(key)||0)+1);
    }
    const sorted=[...buckets.entries()].sort((a,b)=>b[1]-a[1]).slice(0,count);
    return sorted.map(([key,cnt])=>{
      const[r,g,b]=key.split(',').map(Number);
      return{r,g,b,hex:'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join(''),count:cnt};
    });
  }

  // =====================
  // Image Content Classifier
  // =====================
  function classifyImage(img,palette){
    const canvas=document.createElement('canvas');
    const w=Math.min(img.naturalWidth||img.width,200);
    const h=Math.min(img.naturalHeight||img.height,200);
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h).data;

    // Count unique colors
    const colorSet=new Set();
    let totalR=0,totalG=0,totalB=0;
    let edgePixels=0;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i=(y*w+x)*4;
        const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
        colorSet.add(Math.round(r/16)*16+','+Math.round(g/16)*16+','+Math.round(b/16)*16);
        totalR+=r;totalG+=g;totalB+=b;
        // Edge detection (simple)
        if(x>0&&y>0){
          const j=((y-1)*w+x)*4,k=(y*w+x-1)*4;
          const dr=Math.abs(pixels[i]-pixels[j]),dg=Math.abs(pixels[i+1]-pixels[j+1]),db=Math.abs(pixels[i+2]-pixels[j+2]);
          const dr2=Math.abs(pixels[i]-pixels[k]),dg2=Math.abs(pixels[i+1]-pixels[k+1]),db2=Math.abs(pixels[i+2]-pixels[k+2]);
          if(dr+dg+db>60||dr2+dg2+db2>60)edgePixels++;
        }
      }
    }

    const totalPixels=w*h;
    const colorDiversity=colorSet.size;
    const edgeRatio=edgePixels/totalPixels;
    const avgR=totalR/totalPixels,avgG=totalG/totalPixels,avgB=totalB/totalPixels;

    // Classification
    const isBW=palette.every(c=>Math.abs(c.r-c.g)<20&&Math.abs(c.g-c.b)<20&&Math.abs(c.r-c.b)<20);
    const isPhoto=colorDiversity>2000&&edgeRatio>0.3;
    const isGraphic=colorDiversity<500||edgeRatio<0.15;
    const isScreenshot=!isPhoto&&!isGraphic&&edgeRatio>0.2;

    return{isBW,isPhoto,isGraphic,isScreenshot,colorDiversity,edgeRatio};
  }

  // =====================
  // Data Manager
  // =====================
  let data,isEditMode=false,activeTab='photos',lightboxIdx=0,docViewerDoc=null,docViewerMode='original';
  function loadData(){const raw=localStorage.getItem('portfolio_data');if(raw){try{const d=JSON.parse(raw);return migrate(d);}catch(e){}}return JSON.parse(JSON.stringify(DEFAULT_DATA));}
  function migrate(d){if(d.slides&&!d.photos){d.photos=d.slides.filter(s=>s.type!=='video');d.videos=d.slides.filter(s=>s.type==='video');delete d.slides;}if(!d.photos)d.photos=[];if(!d.videos)d.videos=[];if(!d.documents)d.documents=[];if(!d.mediaKeys)d.mediaKeys=['heroBg','aboutImg'];return d;}
  function saveTextData(){localStorage.setItem('portfolio_data',JSON.stringify(data));updateSaveStatus();}
  let saveTimer;function debounceSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveTextData,500);}
  function updateSaveStatus(){const el=document.getElementById('saveStatus');if(!el)return;el.innerHTML='✓ 已保存';el.style.color='#22c55e';clearTimeout(el._timer);el._timer=setTimeout(()=>{el.style.color='';},1800);}
  function getActiveItems(){if(activeTab==='photos')return data.photos||[];if(activeTab==='videos')return data.videos||[];return data.documents||[];}
  function applyTextData(){document.querySelectorAll('[data-key]').forEach(el=>{const key=el.getAttribute('data-key');if(data[key]!==undefined&&document.activeElement!==el&&!el.hasAttribute('data-editable-img'))el.textContent=data[key];});applyContactUrls();}
  function applyContactUrls(){document.querySelectorAll('[data-editable-url]').forEach(el=>{const k=el.getAttribute('data-key');if(data[k]!==undefined)el.textContent=data[k];});document.querySelectorAll('#contactList .contact__item').forEach(item=>{const us=item.querySelector('[data-editable-url]');if(!us)return;const url=data[us.getAttribute('data-key')]||'';if(url&&!isEditMode){item.style.cursor='pointer';item.onclick=()=>window.open(url,'_blank');}else{item.onclick=null;item.style.cursor='';}});}
  function setMediaInContainer(container,url,isVideo){const old=container.querySelector('img,video');if(old)old.remove();const ph=container.querySelector('.about__img-placeholder');if(ph)ph.style.display='none';const el=document.createElement(isVideo?'video':'img');el.src=url;if(isVideo){el.muted=true;el.loop=true;el.playsInline=true;el.autoplay=true;}el.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';container.insertBefore(el,container.firstChild);}
  async function applyAllMedia(){for(const key of(data.mediaKeys||[])){const blob=await dbGet(key);if(!blob)continue;const url=URL.createObjectURL(blob);const isVid=blob.type.startsWith('video/');if(key==='heroBg'){const c=document.querySelector('[data-key="heroBg"]');if(c)setMediaInContainer(c,url,isVid);}if(key==='aboutImg'){const c=document.querySelector('[data-key="aboutImg"]');if(c)setMediaInContainer(c,url,isVid);}if(key.startsWith('slide_')){const el=document.querySelector(`[data-slide-id="${key}"]`);if(el)setSlideMedia(el,url,isVid);}if(key.endsWith('_cover')){const img=document.querySelector(`.doc-card[data-doc-id="${key.replace('_cover','')}"] .doc-card__cover img`);if(img){img.src=url;img.style.display='block';const ph=img.parentElement.querySelector('div');if(ph)ph.style.display='none';}}}}
  function setSlideMedia(el,url,isVideo){const ph=el.querySelector('span[style]');if(ph)ph.remove();const old=el.querySelector('img,video');if(old)old.remove();const m=document.createElement(isVideo?'video':'img');m.src=url;if(isVideo){m.playsInline=true;m.preload='metadata';}m.style.cssText='width:100%;height:100%;object-fit:cover;';el.insertBefore(m,el.firstChild);}

  // =====================
  // Edit Mode
  // =====================
  const editToggle=document.getElementById('editToggle'),editToolbar=document.getElementById('editToolbar'),galleryEditBar=document.getElementById('galleryEditBar');
  function setEditMode(on){isEditMode=on;if(on){document.body.classList.add('edit-mode');editToggle.classList.add('active');editToggle.innerHTML='✕';editToolbar.style.display='flex';galleryEditBar.style.display='flex';document.querySelectorAll('[data-editable]').forEach(el=>{el.contentEditable='true';el.setAttribute('spellcheck','false');});applyContactUrls();}else{document.body.classList.remove('edit-mode');editToggle.classList.remove('active');editToggle.innerHTML='✎';editToolbar.style.display='none';galleryEditBar.style.display='none';document.querySelectorAll('[data-editable]').forEach(el=>{el.contentEditable='false';});applyContactUrls();if(docViewer.classList.contains('open'))closeDocViewer();}renderGallery();}
  editToggle.addEventListener('click',()=>setEditMode(!isEditMode));
  document.addEventListener('input',e=>{if(!isEditMode)return;const el=e.target.closest('[data-key]');if(el&&!el.hasAttribute('data-editable-img')&&!el.hasAttribute('data-editable-url')){data[el.getAttribute('data-key')]=el.textContent;debounceSave();}const uel=e.target.closest('[data-editable-url]');if(uel){data[uel.getAttribute('data-key')]=uel.textContent;debounceSave();}const del=e.target.closest('[data-editable-doc]');if(del&&docViewerDoc){docViewerDoc.title=del.textContent;const d=(data.documents||[]).find(d=>d.id===docViewerDoc.id);if(d)d.title=del.textContent;debounceSave();}});
  document.addEventListener('dblclick',e=>{if(!isEditMode)return;if(e.target.closest('.contact__item')){document.querySelectorAll('[data-editable-url]').forEach(s=>{s.style.display='inline';s.contentEditable='true';s.style.cssText='display:inline;margin-left:6px;font-size:.75rem;color:var(--edit);background:rgba(59,130,246,.06);padding:2px 6px;border-radius:3px;';});}});

  // =====================
  // Upload handlers
  // =====================
  function handleMediaUpload(key,file){if(!file)return;const r=new FileReader();r.onload=async()=>{const blob=new Blob([r.result],{type:file.type});await dbSet(key,blob);if(!data.mediaKeys.includes(key)){data.mediaKeys.push(key);saveTextData();}await applyAllMedia();renderGallery();};r.readAsArrayBuffer(file);}
  document.getElementById('heroBgInput').addEventListener('change',e=>{if(e.target.files[0])handleMediaUpload('heroBg',e.target.files[0]);});
  document.querySelector('[data-key="heroBg"]').addEventListener('click',e=>{if(!isEditMode||e.target.closest('.delete-btn'))return;document.getElementById('heroBgInput').click();});
  document.getElementById('aboutImgInput').addEventListener('change',e=>{if(e.target.files[0])handleMediaUpload('aboutImg',e.target.files[0]);});
  document.querySelector('[data-key="aboutImg"]').addEventListener('click',e=>{if(!isEditMode||e.target.closest('.delete-btn'))return;document.getElementById('aboutImgInput').click();});
  document.addEventListener('click',async e=>{const btn=e.target.closest('[data-delete]');if(!btn||!isEditMode)return;e.stopPropagation();const key=btn.getAttribute('data-delete');await dbDel(key);data.mediaKeys=(data.mediaKeys||[]).filter(k=>k!==key);saveTextData();const c=document.querySelector(`[data-key="${key}"]`);if(c){const m=c.querySelector('img,video');if(m)m.remove();const ph=c.querySelector('.about__img-placeholder');if(ph)ph.style.display='';}});

  let pendingMediaKey=null;
  document.getElementById('slideMediaInput').addEventListener('change',async e=>{
    const file=e.target.files[0];e.target.value='';if(!file||!pendingMediaKey)return;
    const key=pendingMediaKey;pendingMediaKey=null;
    const isVid=file.type.startsWith('video/');
    // Find the pending photo item
    let targetItem=null;
    for(const coll of[data.photos,data.videos]){const s=(coll||[]).find(s=>s.id===key);if(s){s.type=isVid?'video':'image';targetItem=s;break;}}
    saveTextData();
    if(!isVid&&targetItem&&file.type.startsWith('image/')){
      // --- Image analysis pipeline ---
      const arrayBuf=await file.arrayBuffer();
      // Store blob
      const blob=new Blob([arrayBuf],{type:file.type});await dbSet(key,blob);
      if(!data.mediaKeys.includes(key)){data.mediaKeys.push(key);saveTextData();}
      // EXIF
      const exifRaw=parseEXIF(arrayBuf);
      const exifInfo=formatEXIF(exifRaw);
      // Color palette
      const img=await loadImage(blob);
      const palette=extractColorPalette(img);
      // Classification
      const cls=classifyImage(img,palette);
      // Build tags
      const tags=[];
      if(cls.isBW)tags.push('黑白');
      if(cls.isPhoto)tags.push('摄影');
      if(cls.isGraphic)tags.push('平面设计');
      if(cls.isScreenshot||(!cls.isPhoto&&!cls.isGraphic))tags.push('截图');
      // Aspect ratio
      const ratio=(img.naturalWidth||img.width)/(img.naturalHeight||img.height);
      if(ratio>1.3)tags.push('横版');
      else if(ratio<0.8)tags.push('竖版');
      else tags.push('方形');
      // Auto-title from filename
      const filename=file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
      if(!targetItem.title||targetItem.title==='新图片')targetItem.title=filename;
      if(exifInfo.date&&!targetItem.desc)targetItem.desc=exifInfo.date;
      // Store meta
      targetItem.imgMeta={exif:exifInfo,tags,palette:palette.map(c=>c.hex),cls,filename:file.name};
      saveTextData();
      console.log('%c📷 Image Analyzed %c|', 'color:#60a5fa;','',{exif:exifInfo,tags,palette:palette.map(c=>c.hex),cls});
    }else{
      // Video or fallback
      const r=new FileReader();
      r.onload=async()=>{await dbSet(key,new Blob([r.result],{type:file.type}));if(!data.mediaKeys.includes(key)){data.mediaKeys.push(key);saveTextData();}renderGallery();};
      r.readAsArrayBuffer(file);
      renderGallery();return;
    }
    renderGallery();
  });

  function loadImage(blob){return new Promise(r=>{const img=new Image();img.onload=()=>r(img);img.src=URL.createObjectURL(blob);});}

  // =====================
  // Tabs + Gallery
  // =====================
  const tabBtns=document.querySelectorAll('.gallery-tab'),galleryHint=document.getElementById('galleryHint');
  const galleryGrid=document.getElementById('galleryGrid'),galleryCount=document.getElementById('galleryCount');
  const lightbox=document.getElementById('lightbox'),lightboxContent=document.getElementById('lightboxContent'),lightboxInfo=document.getElementById('lightboxInfo'),lightboxCounter=document.getElementById('lightboxCounter'),lightboxPrev=document.getElementById('lightboxPrev'),lightboxNext=document.getElementById('lightboxNext'),lightboxClose=document.getElementById('lightboxClose');
  const exifPanel=document.getElementById('exifPanel'),exifRow=document.getElementById('exifRow'),colorSwatches=document.getElementById('colorSwatches');
  const docViewer=document.getElementById('docViewer'),docViewerBody=document.getElementById('docViewerBody'),docViewerTitle=document.getElementById('docViewerTitle'),docViewerBadge=document.getElementById('docViewerBadge'),docViewerClose=document.getElementById('docViewerClose');
  const docContent=document.getElementById('docContent'),docContentInner=document.getElementById('docContentInner'),docTocList=document.getElementById('docTocList');

  tabBtns.forEach(btn=>{btn.addEventListener('click',()=>{activeTab=btn.getAttribute('data-tab');tabBtns.forEach(b=>b.classList.toggle('active',b===btn));if(activeTab==='docs')galleryHint.textContent='点击文档在线阅读 &nbsp;|&nbsp; 支持原版/整理版双模式';else if(activeTab==='photos')galleryHint.textContent='点击查看详情 &nbsp;|&nbsp; 上传自动分析EXIF/色彩/分类';else galleryHint.textContent='点击视频播放 &nbsp;|&nbsp; 编辑模式下可上传替换';renderGallery();});});

  async function renderGallery(){
    galleryGrid.innerHTML='';const items=getActiveItems();galleryCount.textContent=items.length;
    if(activeTab==='docs')renderDocCards(items);else renderMediaCards(items);
    if(isEditMode){
      const addBtn=document.createElement('div');addBtn.className='gallery-item gallery-item--add';
      const icon=activeTab==='photos'?'🖼':activeTab==='videos'?'🎬':'📄';
      const label=activeTab==='photos'?'添加图片':activeTab==='videos'?'添加视频':'上传PDF';
      addBtn.innerHTML=`<span>${icon}</span>${label}`;addBtn.addEventListener('click',()=>{if(activeTab==='photos')addPhoto();else if(activeTab==='videos')addVideo();else document.getElementById('pdfInput').click();});galleryGrid.appendChild(addBtn);
    }
  }

  function renderMediaCards(items){
    items.forEach((item,i)=>{
      const card=document.createElement('div');card.className='gallery-item';card.setAttribute('data-slide-id',item.id);
      card.innerHTML=`<span class="gallery-item__ph" style="color:var(--text-dim);font-family:var(--font-mono);font-size:.8rem;">${item.type==='video'?'🎬':'🖼'}</span>`;
      const ov=document.createElement('div');ov.className='gallery-item__overlay';
      let ovHtml=`<h3>${escHtml(item.title||'')}</h3><p>${escHtml(item.desc||'')}</p>`;
      // Show tags if analyzed
      if(item.imgMeta&&item.imgMeta.tags){
        ovHtml+='<div class="img-meta">'+item.imgMeta.tags.map(t=>`<span class="img-meta__tag img-meta__tag--type">${t}</span>`).join('')+'</div>';
      }
      ov.innerHTML=ovHtml;card.appendChild(ov);
      if(item.type==='video'){const b=document.createElement('div');b.className='gallery-item__badge';b.textContent='▶ 视频';card.appendChild(b);}
      const up=document.createElement('div');up.className='gallery-item__upload';up.innerHTML='<span>🔄 替换</span>';up.addEventListener('click',e=>{e.stopPropagation();pendingMediaKey=item.id;document.getElementById('slideMediaInput').click();});card.appendChild(up);
      const del=document.createElement('button');del.className='gallery-item__del';del.textContent='✕';del.addEventListener('click',e=>{e.stopPropagation();deleteItem(i);});card.appendChild(del);
      card.addEventListener('click',()=>openLightbox(i));galleryGrid.appendChild(card);
    });loadMediaCards();
  }

  async function loadMediaCards(){
    const items=getActiveItems();for(const item of items){const blob=await dbGet(item.id);if(!blob)continue;const url=URL.createObjectURL(blob);const card=document.querySelector(`.gallery-item[data-slide-id="${item.id}"]`);if(!card)continue;const ph=card.querySelector('.gallery-item__ph');if(ph)ph.remove();const el=document.createElement(item.type==='video'?'video':'img');el.src=url;if(item.type==='video'){el.muted=true;el.playsInline=true;el.preload='metadata';}el.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;';card.insertBefore(el,card.firstChild);}
  }

  function renderDocCards(docs){
    docs.forEach((doc,i)=>{
      const card=document.createElement('div');card.className='doc-card';card.setAttribute('data-doc-id',doc.id);
      const cover=document.createElement('div');cover.className='doc-card__cover';cover.innerHTML='<img src="" alt="" style="display:none;"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-family:var(--font-mono);font-size:.75rem;">PDF</div>';card.appendChild(cover);
      const body=document.createElement('div');body.className='doc-card__body';body.innerHTML=`<h3>${escHtml(doc.title||'未命名')}</h3><p>${doc.pageCount||0} 页${doc.hasStructuredContent?' · 已分析':''}</p>`;card.appendChild(body);
      const bdg=document.createElement('div');bdg.className='doc-card__badge';bdg.textContent=(doc.pageCount||0)+' 页';card.appendChild(bdg);
      const up=document.createElement('div');up.className='doc-card__upload';up.innerHTML='<span>🔄 替换PDF</span>';up.addEventListener('click',e=>{e.stopPropagation();pendingReplaceDocId=doc.id;document.getElementById('pdfInput').click();});card.appendChild(up);
      const del=document.createElement('button');del.className='doc-card__del';del.textContent='✕';del.addEventListener('click',e=>{e.stopPropagation();deleteItem(i);});card.appendChild(del);
      card.addEventListener('click',()=>openDocViewer(doc));galleryGrid.appendChild(card);
    });loadDocCovers();
  }

  async function loadDocCovers(){for(const doc of(data.documents||[])){const blob=await dbGet(doc.id+'_cover');if(!blob)continue;const url=URL.createObjectURL(blob);const card=document.querySelector(`.doc-card[data-doc-id="${doc.id}"]`);if(!card)continue;const img=card.querySelector('.doc-card__cover img');const ph=card.querySelector('.doc-card__cover div');if(img){img.src=url;img.style.display='block';}if(ph)ph.style.display='none';}}

  // =====================
  // Lightbox with EXIF Panel
  // =====================
  function openLightbox(idx){const items=getActiveItems();if(!items.length)return;lightboxIdx=idx;showLightboxSlide();lightbox.classList.add('open');document.body.style.overflow='hidden';}
  async function showLightboxSlide(){
    const items=getActiveItems();const item=items[lightboxIdx];if(!item)return;
    lightboxInfo.querySelector('h3').textContent=item.title||'';
    lightboxInfo.querySelector('p').textContent=item.desc||'';
    lightboxCounter.textContent=`${lightboxIdx+1}/${items.length}`;
    exifRow.innerHTML='';colorSwatches.innerHTML='';

    const blob=await dbGet(item.id);
    if(!blob){lightboxContent.innerHTML='<span style="color:var(--text-dim);">无媒体</span>';return;}
    const url=URL.createObjectURL(blob);
    if(blob.type.startsWith('video/')){
      lightboxContent.innerHTML=`<video src="${url}" controls autoplay playsinline style="max-width:90vw;max-height:85vh;"></video>`;
    }else{
      lightboxContent.innerHTML=`<img src="${url}" alt="">`;
      // Show EXIF + color data
      if(item.imgMeta){
        const{exif,tags,palette,cls}=item.imgMeta;
        let html='';
        if(exif.camera)html+=`<div class="exif-item"><span class="exif-label">相机</span><span class="exif-value">${exif.camera}</span></div>`;
        if(exif.date)html+=`<div class="exif-item"><span class="exif-label">日期</span><span class="exif-value">${exif.date}</span></div>`;
        if(exif.iso||exif.aperture||exif.shutter){
          const camStr=[exif.shutter,exif.aperture,exif.iso,exif.focal].filter(Boolean).join(' · ');
          html+=`<div class="exif-item"><span class="exif-label">参数</span><span class="exif-value">${camStr}</span></div>`;
        }
        if(exif.gps)html+=`<div class="exif-item"><span class="exif-label">GPS</span><span class="exif-value">${exif.gps.lat},${exif.gps.lon}</span></div>`;
        exifRow.innerHTML=html||'<span style="color:var(--text-dim);font-size:.7rem;">无 EXIF 数据</span>';

        if(palette&&palette.length){
          colorSwatches.innerHTML=palette.map(hex=>`<div class="color-swatch" style="background:${hex};" title="${hex}"></div>`).join('');
        }
      }else{
        exifRow.innerHTML='<span style="color:var(--text-dim);font-size:.7rem;">该图片未经过自动分析<br>编辑模式下重新上传即可自动分析</span>';
      }
    }
  }
  function closeLightbox(){lightbox.classList.remove('open');lightboxContent.innerHTML='';document.body.style.overflow='';}
  lightboxClose.addEventListener('click',closeLightbox);lightboxPrev.addEventListener('click',()=>{const items=getActiveItems();lightboxIdx=((lightboxIdx-1)%items.length+items.length)%items.length;showLightboxSlide();});lightboxNext.addEventListener('click',()=>{const items=getActiveItems();lightboxIdx=(lightboxIdx+1)%items.length;showLightboxSlide();});lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox();});

  // =====================
  // Document Viewer
  // =====================
  const docViewerModeBtns=document.querySelectorAll('[data-doc-mode]');
  docViewerModeBtns.forEach(btn=>{btn.addEventListener('click',()=>{docViewerMode=btn.getAttribute('data-doc-mode');docViewerModeBtns.forEach(b=>b.classList.toggle('active',b===btn));switchDocViewerMode();});});
  function switchDocViewerMode(){if(!docViewerDoc)return;if(docViewerMode==='formatted'){docViewerBody.style.display='none';docContent.style.display='flex';renderFormattedView(docViewerDoc);}else{docViewerBody.style.display='';docContent.style.display='none';if(docViewerBody.children.length===0)loadDocViewerPages(docViewerDoc);}}
  async function openDocViewer(doc){
    docViewerDoc=doc;docViewerMode='original';
    docViewerModeBtns.forEach(b=>b.classList.toggle('active',b.getAttribute('data-doc-mode')==='original'));
    docViewerTitle.textContent=doc.title||'未命名';docViewerTitle.contentEditable=isEditMode?'true':'false';
    docViewerBadge.textContent=(doc.pageCount||0)+' 页';
    docViewerBody.innerHTML='';docViewerBody.style.display='';docContent.style.display='none';docTocList.innerHTML='';
    docViewer.classList.add('open');document.body.style.overflow='hidden';
    loadDocViewerPages(doc);
    if(doc.hasStructuredContent){const blob=await dbGet(doc.id+'_structured');if(blob){try{doc.structuredContent=JSON.parse(await blob.text());}catch(e){}}}
    buildTOC(doc);
  }
  async function loadDocViewerPages(doc){docViewerBody.innerHTML='';for(let i=0;i<(doc.pageCount||0);i++){const pw=document.createElement('div');pw.className='doc-page';pw.id='doc-page-'+i;const loader=document.createElement('div');loader.style.cssText='display:flex;align-items:center;justify-content:center;padding:40px;color:var(--text-dim);font-family:var(--font-mono);font-size:.75rem;';loader.textContent='加载中...';pw.appendChild(loader);const pn=document.createElement('div');pn.className='doc-page__num';pn.textContent=(i+1);pw.appendChild(pn);docViewerBody.appendChild(pw);const blob=await dbGet(doc.id+'_page_'+i);if(blob){const url=URL.createObjectURL(blob);const img=document.createElement('img');img.src=url;img.onload=()=>loader.remove();pw.insertBefore(img,loader);loader.remove();}else{loader.textContent='页面缺失';}}}
  function buildTOC(doc){docTocList.innerHTML='';const sc=doc.structuredContent;if(!sc||!sc.pages){docTocList.innerHTML='<span style="font-size:.75rem;color:var(--text-dim);">暂无目录</span>';return;}const allBlocks=[];sc.pages.forEach((page,pIdx)=>{(page.blocks||[]).forEach(block=>allBlocks.push({...block,pageNum:pIdx}));});if(!allBlocks.length){docTocList.innerHTML='<span style="font-size:.75rem;color:var(--text-dim);">暂无内容</span>';return;}allBlocks.forEach((block,i)=>{if(block.type==='h1'||block.type==='h2'){const a=document.createElement('a');a.href='#';a.textContent=(block.type==='h1'?'':'  ')+block.content;const pn=block.pageNum;a.addEventListener('click',e=>{e.preventDefault();if(docViewerMode==='formatted'){const t=document.getElementById('fmt-block-'+i);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}else{const t=document.getElementById('doc-page-'+pn);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}document.querySelectorAll('.doc-toc a').forEach(a=>a.classList.remove('active'));a.classList.add('active');});docTocList.appendChild(a);}});if(docTocList.children.length===0)docTocList.innerHTML='<span style="font-size:.75rem;color:var(--text-dim);">无标题</span>';}
  function renderFormattedView(doc){
    docContentInner.innerHTML='<div class="doc-content__loading">正在提取分析内容...</div>';
    const sc=doc.structuredContent;if(!sc||!sc.pages||!sc.pages.length){docContentInner.innerHTML='<div class="doc-content__loading">该文档尚未进行内容分析。<br><br>请重新上传 PDF 以自动提取和分析内容。</div>';return;}
    docContentInner.innerHTML='';const allBlocks=[];sc.pages.forEach((page,pIdx)=>{(page.blocks||[]).forEach(block=>allBlocks.push({...block,pageNum:pIdx}));});if(!allBlocks.length){docContentInner.innerHTML='<div class="doc-content__loading">未能提取到文字内容。<br><br>该 PDF 可能全部为图片格式。</div>';return;}
    let prevPage=-1;allBlocks.forEach((block,bi)=>{
      if(prevPage!==-1&&block.pageNum!==prevPage){const pb=document.createElement('div');pb.className='doc-block doc-block--page-break';pb.innerHTML=`第 ${block.pageNum+1} 页`;docContentInner.appendChild(pb);}prevPage=block.pageNum;
      const div=document.createElement('div');div.id='fmt-block-'+bi;
      if(block.type==='h1')div.className='doc-block doc-block--h1';else if(block.type==='h2')div.className='doc-block doc-block--h2';else if(block.type==='h3')div.className='doc-block doc-block--h3';else if(block.type==='image'){div.className='doc-block doc-block--image';div.innerHTML=`<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:20px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:.75rem;">📷 图片区域（第${block.pageNum+1}页）</div>`;docContentInner.appendChild(div);return;}else div.className='doc-block doc-block--text';
      div.textContent=block.content;docContentInner.appendChild(div);
    });buildTOC(doc);
  }
  function closeDocViewer(){docViewer.classList.remove('open');docViewerBody.innerHTML='';docContentInner.innerHTML='';docTocList.innerHTML='';docViewerDoc=null;document.body.style.overflow='';if(isEditMode)renderGallery();}
  docViewerClose.addEventListener('click',closeDocViewer);

  // =====================
  // PDF Processing (text + structure)
  // =====================
  const progressOverlay=document.getElementById('uploadProgress'),progressFill=document.getElementById('progressFill'),progressText=document.getElementById('progressText');
  let pendingReplaceDocId=null;
  document.getElementById('pdfInput').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;await processPDF(file);});

  async function processPDF(file){
    progressOverlay.classList.add('show');progressFill.style.width='0%';progressText.textContent='读取文件...';
    const arrayBuf=await file.arrayBuffer();progressText.textContent='解析PDF...';progressFill.style.width='5%';
    const pdf=await pdfjsLib.getDocument({data:arrayBuf}).promise;const pageCount=pdf.numPages;
    progressText.textContent=`共 ${pageCount} 页，正在逐页渲染并提取内容...`;
    if(pendingReplaceDocId){await dbDelPrefix(pendingReplaceDocId+'_');data.documents=(data.documents||[]).filter(d=>d.id!==pendingReplaceDocId);}
    const docId=pendingReplaceDocId||('doc_'+Date.now());pendingReplaceDocId=null;const docTitle=file.name.replace(/\.(pdf|doc|docx)$/i,'');
    const structuredContent={pages:[]};const newKeys=[];
    for(let i=0;i<pageCount;i++){
      const page=await pdf.getPage(i+1);const scale=1.5;const viewport=page.getViewport({scale});
      const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;const ctx=canvas.getContext('2d');await page.render({canvasContext:ctx,viewport}).promise;
      const pageBlob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',0.85));
      await dbSet(docId+'_page_'+i,pageBlob);newKeys.push(docId+'_page_'+i);
      if(i===0){await dbSet(docId+'_cover',pageBlob);newKeys.push(docId+'_cover');}
      const textContent=await page.getTextContent();const blocks=classifyTextBlocks(textContent,viewport.height,viewport.width);
      const hasImage=await pageHasImages(page);if(hasImage&&blocks.length===0){blocks.push({type:'image',content:'',fontSize:0});}
      structuredContent.pages.push({pageNum:i,blocks});
      const pct=5+Math.round((i+1)/pageCount*85);progressFill.style.width=pct+'%';progressText.textContent=`分析第 ${i+1}/${pageCount} 页...`;
    }
    structuredContent.pageCount=pageCount;const scBlob=new Blob([JSON.stringify(structuredContent)],{type:'application/json'});await dbSet(docId+'_structured',scBlob);newKeys.push(docId+'_structured');
    data.documents.push({id:docId,title:docTitle,desc:'',pageCount,type:'pdf',hasStructuredContent:true});
    data.mediaKeys=[...(data.mediaKeys||[]),...newKeys.filter(k=>!data.mediaKeys.includes(k))];saveTextData();
    progressFill.style.width='100%';progressText.textContent=`完成！已提取 ${countBlocks(structuredContent)} 个内容块`;
    setTimeout(()=>{progressOverlay.classList.remove('show');activeTab='docs';tabBtns.forEach(b=>b.classList.toggle('active',b.getAttribute('data-tab')==='docs'));galleryHint.textContent='点击文档在线阅读 &nbsp;|&nbsp; 支持原版/整理版双模式';renderGallery();},600);
  }

  function classifyTextBlocks(textContent,pageHeight,pageWidth){
    const items=textContent.items.filter(it=>it.str&&it.str.trim().length>0);if(!items.length)return[];
    const EPSILON=3;const lines=[];items.forEach(item=>{const y=Math.round(item.transform[5]/EPSILON)*EPSILON;let line=lines.find(l=>Math.abs(l.y-y)<EPSILON);if(!line){line={y,items:[]};lines.push(line);}line.items.push(item);});
    lines.sort((a,b)=>b.y-a.y);const allSizes=lines.flatMap(l=>l.items.map(it=>it.transform[0]));const avgSize=allSizes.reduce((a,b)=>a+b,0)/allSizes.length;
    const lineInfo=lines.map(line=>{const text=line.items.map(it=>it.str).join(' ').replace(/\s+/g,' ').trim();const maxFontSize=Math.max(...line.items.map(it=>it.transform[0]));const x=Math.min(...line.items.map(it=>it.transform[4]));let type='text';if(maxFontSize>avgSize*1.5)type='h1';else if(maxFontSize>avgSize*1.2)type='h2';else if(maxFontSize>avgSize*1.05&&text.length<80)type='h3';return{type,text,maxFontSize,x};});
    if(lineInfo.length>1){const gaps=[];for(let i=1;i<lineInfo.length;i++){gaps.push(lines[i-1].y-lines[i].y);}const avgGap=gaps.reduce((a,b)=>a+b,0)/gaps.length;const paragraphThreshold=avgGap*1.8;const merged=[];let current=null;lineInfo.forEach((li,i)=>{if(!current){current={type:li.type,text:li.text,fontSize:li.maxFontSize};}else{const gap=lines[i-1].y-lines[i].y;if(li.type===current.type&&gap<paragraphThreshold&&li.type==='text'){current.text+=' '+li.text;}else{if(current.text.trim())merged.push({...current});current={type:li.type,text:li.text,fontSize:li.maxFontSize};}}});if(current&&current.text.trim())merged.push({...current});return merged.map(m=>({type:m.type,content:m.text,fontSize:m.fontSize}));}
    return lineInfo.map(li=>({type:li.type,content:li.text,fontSize:li.maxFontSize}));
  }

  async function pageHasImages(page){try{const ops=await page.getOperatorList();return ops.fnArray.some(fn=>fn===pdfjsLib.OPS.paintImageXObject||fn===pdfjsLib.OPS.paintInlineImageXObject);}catch(e){return false;}}
  function countBlocks(sc){let n=0;sc.pages.forEach(p=>n+=(p.blocks||[]).length);return n;}

  // =====================
  // Keyboard
  // =====================
  document.addEventListener('keydown',e=>{if(e.target.contentEditable==='true'||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(lightbox.classList.contains('open')){if(e.key==='ArrowLeft'){const items=getActiveItems();lightboxIdx=((lightboxIdx-1)%items.length+items.length)%items.length;showLightboxSlide();}if(e.key==='ArrowRight'){const items=getActiveItems();lightboxIdx=(lightboxIdx+1)%items.length;showLightboxSlide();}if(e.key==='Escape')closeLightbox();}if(docViewer.classList.contains('open')&&e.key==='Escape')closeDocViewer();});

  // =====================
  // Item CRUD
  // =====================
  function addPhoto(){const id='slide_'+Date.now();data.photos.push({id,title:'新图片',desc:'',type:'image'});saveTextData();renderGallery();pendingMediaKey=id;setTimeout(()=>document.getElementById('slideMediaInput').click(),300);}
  function addVideo(){const id='slide_'+Date.now();data.videos.push({id,title:'新视频',desc:'',type:'video'});saveTextData();renderGallery();pendingMediaKey=id;setTimeout(()=>document.getElementById('slideMediaInput').click(),300);}
  async function deleteItem(index){const items=getActiveItems();if(!items.length)return;const item=items[index];if(!confirm('确定删除「'+(item.title||(item.pageCount?item.pageCount+'页文档':'未命名'))+'」？'))return;if(activeTab==='docs'){await dbDelPrefix(item.id+'_');data.mediaKeys=(data.mediaKeys||[]).filter(k=>!k.startsWith(item.id));data.documents.splice(index,1);}else{await dbDel(item.id);data.mediaKeys=(data.mediaKeys||[]).filter(k=>k!==item.id);if(activeTab==='photos')data.photos.splice(index,1);else data.videos.splice(index,1);}saveTextData();if(lightbox.classList.contains('open'))closeLightbox();if(docViewer.classList.contains('open'))closeDocViewer();renderGallery();}

  // =====================
  // Toolbar
  // =====================
  document.getElementById('btnAddPhoto').addEventListener('click',()=>{activeTab='photos';tabBtns.forEach(b=>b.classList.toggle('active',b.getAttribute('data-tab')==='photos'));renderGallery();addPhoto();});
  document.getElementById('btnAddVideo').addEventListener('click',()=>{activeTab='videos';tabBtns.forEach(b=>b.classList.toggle('active',b.getAttribute('data-tab')==='videos'));renderGallery();addVideo();});
  document.getElementById('btnAddDoc').addEventListener('click',()=>{activeTab='docs';tabBtns.forEach(b=>b.classList.toggle('active',b.getAttribute('data-tab')==='docs'));renderGallery();document.getElementById('pdfInput').click();});
  document.getElementById('btnAddPhotoGrid').addEventListener('click',addPhoto);
  document.getElementById('btnAddVideoGrid').addEventListener('click',addVideo);
  document.getElementById('btnAddDocGrid').addEventListener('click',()=>document.getElementById('pdfInput').click());

  // Export
  document.getElementById('btnExport').addEventListener('click',async()=>{const exportData=JSON.parse(JSON.stringify(data));const keys=new Set([...(exportData.mediaKeys||[])]);for(const s of[...(exportData.photos||[]),...(exportData.videos||[])])keys.add(s.id);for(const d of(exportData.documents||[])){keys.add(d.id+'_cover');keys.add(d.id+'_structured');for(let i=0;i<(d.pageCount||0);i++)keys.add(d.id+'_page_'+i);}for(const key of keys){const blob=await dbGet(key);if(blob)exportData['_m_'+key]={type:blob.type,data:await blobToBase64(blob)};}downloadFile('portfolio-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(exportData,null,2),'application/json');});
  function blobToBase64(blob){return new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.readAsDataURL(blob);});}
  function downloadFile(fn,content,mime){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:mime}));a.download=fn;a.click();URL.revokeObjectURL(a.href);}
  document.getElementById('btnImport').addEventListener('click',()=>document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{const imported=migrate(JSON.parse(await file.text()));const newMediaKeys=[];for(const key of Object.keys(imported)){if(key.startsWith('_m_')){const mk=key.replace('_m_','');const{type,data:b64}=imported[key];const bin=atob(b64);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);await dbSet(mk,new Blob([bytes],{type}));newMediaKeys.push(mk);delete imported[key];}}imported.mediaKeys=newMediaKeys;data=imported;saveTextData();applyTextData();activeTab='photos';tabBtns.forEach(b=>b.classList.toggle('active',b.getAttribute('data-tab')==='photos'));renderGallery();await applyAllMedia();setEditMode(false);alert('✓ 数据导入成功！');}catch(err){alert('导入失败');console.error(err);}});
  document.getElementById('btnReset').addEventListener('click',async()=>{if(!confirm('确定重置？不可撤销！'))return;const db=await openDB();await new Promise(r=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=r;});localStorage.removeItem('portfolio_data');location.reload();});

  // Mobile + Nav
  const navToggle=document.getElementById('navToggle'),navLinksEl=document.getElementById('navLinks');navToggle.addEventListener('click',()=>{navToggle.classList.toggle('open');navLinksEl.classList.toggle('open');});navLinksEl.querySelectorAll('a').forEach(l=>{l.addEventListener('click',()=>{navToggle.classList.remove('open');navLinksEl.classList.remove('open');});});
  const sections=document.querySelectorAll('section[id]');const navAnchors=document.querySelectorAll('.nav__links a');const sectionObs=new IntersectionObserver(entries=>{entries.forEach(en=>{if(!en.isIntersecting)return;navAnchors.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+en.target.id));});},{rootMargin:'-40% 0px -40% 0px'});sections.forEach(s=>sectionObs.observe(s));

  function escHtml(s){const d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}

  // =====================
  // Auth System
  // =====================
  const AUTH_KEY = 'portfolio_auth';
  const PASSWORD_KEY = 'portfolio_password';
  let isAuthenticated = sessionStorage.getItem(AUTH_KEY) === '1';

  const pwModal    = document.getElementById('pwModal');
  const pwInput    = document.getElementById('pwInput');
  const pwSubmit   = document.getElementById('pwSubmit');
  const pwModalMsg = document.getElementById('pwModalMsg');
  const pwHint     = document.getElementById('pwHint');
  const adminLink  = document.getElementById('adminLink');

  // Simple hash for password storage
  async function simpleHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function showAuthUI() {
    editToggle.classList.add('visible');
    adminLink.textContent = '🔓 退出编辑';
    adminLink.style.color = 'var(--edit)';
  }

  function hideAuthUI() {
    if (isEditMode) setEditMode(false);
    editToggle.classList.remove('visible', 'active');
    editToggle.innerHTML = '✎';
    adminLink.textContent = '🔑 管理';
    adminLink.style.color = '';
  }

  function openPwModal(msg, hint) {
    pwModalMsg.textContent = msg || '输入密码以开启编辑功能';
    pwHint.textContent = hint || '';
    pwInput.value = '';
    pwInput.classList.remove('wrong');
    pwModal.classList.add('open');
    setTimeout(() => pwInput.focus(), 200);
  }

  function closePwModal() {
    pwModal.classList.remove('open');
    pwInput.value = '';
    pwInput.classList.remove('wrong');
  }

  adminLink.addEventListener('click', () => {
    if (isAuthenticated) {
      // Logout
      isAuthenticated = false;
      sessionStorage.removeItem(AUTH_KEY);
      hideAuthUI();
      closePwModal();
    } else {
      openPwModal();
    }
  });

  pwSubmit.addEventListener('click', async () => {
    const entered = pwInput.value.trim();
    if (!entered) { pwInput.classList.add('wrong'); return; }

    const storedHash = localStorage.getItem(PASSWORD_KEY);

    if (!storedHash) {
      // First time setup
      if (entered.length < 4) {
        pwModalMsg.textContent = '密码至少4位';
        pwInput.classList.add('wrong');
        return;
      }
      const hash = await simpleHash(entered);
      localStorage.setItem(PASSWORD_KEY, hash);
      isAuthenticated = true;
      sessionStorage.setItem(AUTH_KEY, '1');
      showAuthUI();
      closePwModal();
      alert('✓ 密码已设置！\n\n请牢记你的密码：' + entered + '\n\n你的作品集链接现在可以安全分享了——访客只能查看，无法编辑。');
      return;
    }

    // Verify
    const hash = await simpleHash(entered);
    if (hash === storedHash) {
      isAuthenticated = true;
      sessionStorage.setItem(AUTH_KEY, '1');
      showAuthUI();
      closePwModal();
    } else {
      pwInput.classList.add('wrong');
      pwModalMsg.textContent = '密码错误，请重试';
    }
  });

  pwInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') pwSubmit.click();
    if (e.key === 'Escape') closePwModal();
  });

  pwModal.addEventListener('click', e => {
    if (e.target === pwModal) closePwModal();
  });

  // Intercept edit toggle to check auth
  const origEditToggleClick = editToggle.onclick;
  editToggle.addEventListener('click', (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      e.stopPropagation();
      openPwModal();
    }
  }, true);

  async function init(){
    data=loadData();
    ['navHome','navGallery','navAbout','navContact'].forEach(k=>{if(!data[k])data[k]=DEFAULT_DATA[k];});
    applyTextData();renderGallery();await applyAllMedia();applyContactUrls();
    document.querySelectorAll('[data-editable]').forEach(el=>{el.contentEditable='false';el.setAttribute('spellcheck','false');});

    // Restore auth state
    if (isAuthenticated) showAuthUI();

    // If no password set yet, show hint
    const hasPw = localStorage.getItem(PASSWORD_KEY);
    if (!hasPw) {
      pwHint.textContent = '首次使用：设置一个管理密码';
    }
  }
  init();
  console.log('%c🎨 Portfolio CMS v6 %c| %c🔑密码保护 · 📷 EXIF · 🎨 色彩 · 📄 PDF','font-size:1.1em;font-weight:bold;','','');
});
