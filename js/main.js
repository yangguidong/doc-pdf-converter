/* ============================================
   Portfolio CMS — Clean Rebuild
   ============================================ */
document.addEventListener('DOMContentLoaded',()=>{

// === IndexedDB ===
const DB='PF_DB',S='media';
function odb(){return new Promise((ok,fail)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore(S)};r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)})}
async function dbGet(k){const db=await odb();return new Promise(ok=>{const t=db.transaction(S,'readonly');const r=t.objectStore(S).get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null)})}
async function dbSet(k,b){const db=await odb();return new Promise(ok=>{const t=db.transaction(S,'readwrite');t.objectStore(S).put(b,k);t.oncomplete=()=>ok()})}
async function dbDel(k){const db=await odb();return new Promise(ok=>{const t=db.transaction(S,'readwrite');t.objectStore(S).delete(k);t.oncomplete=()=>ok()})}

// === Defaults ===
const DEF={siteName:'我的作品集',heroTitle:'张伟',heroSub:'摄影师 / 视觉艺术家',aboutTitle:'关于我',aboutName:'张伟',aboutTagline:'摄影师 / 视觉艺术家',aboutBio:'我是一名摄影师和视觉艺术家，专注于捕捉光影之间的微妙瞬间。作品涵盖人像、风光、商业摄影等领域，致力于用镜头讲述独特的故事。',profile:{name:'张伟',title:'摄影师 / 视觉艺术家',age:'24',location:'杭州',email:'hello@example.com',phone:'+86 138-0000-0000',bio:'我是一名摄影师和视觉艺术家，专注于捕捉光影之间的微妙瞬间。'},workExperience:[],education:[],aboutAvatar:'',contactTitle:'联系方式',contactEmail:'邮箱',contactIg:'Instagram',contactBe:'Behance',photos:[],videos:[],photoCats:['环艺作品','平面设计作品','AIGC作品','品牌设计','UI/UX设计','插画作品','摄影作品','包装设计','C4D/3D','其他'],videoCats:['品牌广告','产品动画','Motion设计','3D短片','宣传片','纪录片','短视频','其他'],mediaKeys:[]};

// === State ===
let data,edit=false,auth=sessionStorage.getItem('pf_auth')==='1',tab='photos',lbIdx=0,pKey=null,stackItem=null;

function load(){const r=localStorage.getItem('pf_data2');if(r){try{const d=JSON.parse(r);return migrate(d)}catch(e){}}return JSON.parse(JSON.stringify(DEF))}
function migrate(d){if(!d.profile)d.profile=JSON.parse(JSON.stringify(DEF.profile));
else{const dp=DEF.profile;for(const k of Object.keys(dp)){if(d.profile[k]===undefined)d.profile[k]=dp[k]}}if(!d.workExperience)d.workExperience=[];if(!d.education)d.education=[];if(d.aboutAvatar===undefined)d.aboutAvatar='';if(!d.photoCats||!d.photoCats.length)d.photoCats=['环艺作品','平面设计作品','AIGC作品','品牌设计','UI/UX设计','插画作品','摄影作品','包装设计','C4D/3D','其他'];if(!d.videoCats||!d.videoCats.length)d.videoCats=['品牌广告','产品动画','Motion设计','3D短片','宣传片','纪录片','短视频','其他'];if(!d.photos)d.photos=[];if(!d.videos)d.videos=[];if(!d.mediaKeys)d.mediaKeys=[];return d}
function save(){localStorage.setItem('pf_data2',JSON.stringify(data));updateSt()}
let tmr;function ds(){clearTimeout(tmr);tmr=setTimeout(save,500)}
function updateSt(){const e=document.getElementById('saveStatus');if(!e)return;e.textContent='已保存 '+new Date().toLocaleTimeString();e.style.color='#22c55e';setTimeout(()=>e.style.color='',2000)}
function items(){const raw=tab==='photos'?(data.photos||[]):(data.videos||[]);return catFilter?raw.filter(x=>x.cat===catFilter):raw}
function cats(){return tab==='photos'?(data.photoCats||[]):(data.videoCats||[])}
function idx(item){return items().indexOf(item)}

function applyText(){document.querySelectorAll('[data-key]').forEach(el=>{const k=el.getAttribute('data-key');if(k==='heroSub')return;if(data[k]!==undefined&&document.activeElement!==el)el.textContent=data[k]});renderAbout()}

// === Auth ===
const pwModal=document.getElementById('pwModal'),pwInput=document.getElementById('pwInput'),pwHint=document.getElementById('pwHint'),adminLink=document.getElementById('adminLink'),editFab=document.getElementById('editFab'),editBar=document.getElementById('editBar');
async function sha(s){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function showAu(){adminLink.textContent='Lock';adminLink.style.color='var(--edit)'}
function hideAu(){if(edit)toggleEdit();editFab.classList.remove('active');editFab.innerHTML='&#9998;';adminLink.textContent='Manage';adminLink.style.color=''}
adminLink.addEventListener('click',()=>{if(auth){auth=false;sessionStorage.removeItem('pf_auth');hideAu();closePw()}else openPw()})
function openPw(){pwInput.value='';pwInput.classList.remove('wrong');pwModal.classList.add('open');setTimeout(()=>pwInput.focus(),200)}
function closePw(){pwModal.classList.remove('open')}
document.getElementById('pwSubmit').addEventListener('click',async()=>{const v=pwInput.value.trim();if(!v){pwInput.classList.add('wrong');return}const s=localStorage.getItem('pf_pw');if(!s){if(v.length<4){pwInput.classList.add('wrong');return}localStorage.setItem('pf_pw',await sha(v));auth=true;sessionStorage.setItem('pf_auth','1');showAu();closePw();alert('密码已设置：'+v+'\n\n分享链接时他人无法编辑。');return}if(await sha(v)===s){auth=true;sessionStorage.setItem('pf_auth','1');showAu();closePw()}else{pwInput.classList.add('wrong')}})
pwInput.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('pwSubmit').click();if(e.key==='Escape')closePw()})
pwModal.addEventListener('click',e=>{if(e.target===pwModal)closePw()})

// === Edit ===
function toggleEdit(){edit=!edit;if(edit){document.body.classList.add('edit');editFab.classList.add('active');editFab.innerHTML='&#10005;';editBar.style.display='flex';if(document.getElementById('catEditBar'))document.getElementById('catEditBar').style.display='block'}else{document.body.classList.remove('edit');editFab.classList.remove('active');editFab.innerHTML='&#9998;';editBar.style.display='none';if(document.getElementById('catEditBar'))document.getElementById('catEditBar').style.display='none'}document.querySelectorAll('[data-editable]').forEach(el=>{el.contentEditable=edit?'true':'false';el.setAttribute('spellcheck','false')});setAboutEditable(edit);render();if(typingTimer){clearTimeout(typingTimer);initTypingText()}}
editFab.addEventListener('click',()=>{if(!auth&&localStorage.getItem('pf_pw')){openPw();return}toggleEdit()})
document.addEventListener('input',e=>{if(!edit)return;const el=e.target.closest('[data-key]');if(!el)return;data[el.getAttribute('data-key')]=el.textContent;ds()})

// === File Picker ===
function pick(accept,multi,cb){const inp=document.createElement('input');inp.type='file';inp.accept=accept;inp.multiple=multi;inp.style.cssText='position:fixed;top:-100px;left:0;opacity:0;z-index:9999';document.body.appendChild(inp);inp.addEventListener('change',()=>{cb(inp.files);document.body.removeChild(inp)});setTimeout(()=>inp.click(),10)}

// === Render ===
const content=document.getElementById('worksContent');
const lbox=document.getElementById('lbox'),lbCont=document.getElementById('lbContent'),lbInfo=document.getElementById('lbInfo'),lbCnt=document.getElementById('lbCounter');
const stack=document.getElementById('stack'),stackB=document.getElementById('stackBody'),stackCnt=document.getElementById('stackCount');

function render(){
  content.innerHTML='';const raw=items();
  // Group by category — only show non-empty or all in edit mode
  const groups={};cats().forEach(c=>{groups[c]=[]});
  raw.forEach(item=>{const c=item.cat||cats()[0]||'其他';if(!groups[c])groups[c]=[];groups[c].push(item)});
  let gi=0;
  Object.keys(groups).forEach(cat=>{
    const its=groups[cat];if(!its.length&&!edit)return;
    const sec=document.createElement('div');sec.className='cat-section';
    const hdr=document.createElement('div');hdr.className='cat-header';
    hdr.innerHTML='<span class="cat-num">'+(gi+1).toString().padStart(2,'0')+'</span><h2 class="cat-title">'+esc(cat)+'</h2><span class="cat-count">'+its.length+' items</span>';
    sec.appendChild(hdr);gi++;
    if(its.length){const grid=document.createElement('div');grid.className='item-grid';its.forEach(item=>renderCard(item,grid));if(edit){const add=document.createElement('div');add.className='card card--add';add.innerHTML='<span>+</span>Add to '+esc(cat);add.addEventListener('click',()=>newItem(cat));grid.appendChild(add)}sec.appendChild(grid)}
    else if(edit){const add=document.createElement('div');add.className='card card--add';add.style.cssText='display:flex;aspect-ratio:auto;min-height:50px;margin:0 auto;max-width:400px';add.innerHTML='<span>+</span>添加作品到 '+esc(cat);add.addEventListener('click',()=>newItem(cat));sec.appendChild(add)}
    content.appendChild(sec);
  });
  loadMedia();
}

function renderCard(item,grid){
  const wrap=document.createElement('div');wrap.className='card-wrap';
  const card=document.createElement('div');card.className='card';card.setAttribute('data-id',item.id);
  card.innerHTML='<span class="card__ph">'+(item.type==='video'?'&#9654; Video':'Photo')+'</span>';
  card.addEventListener('click',()=>{if(tab==='photos')openStack(item);else openLb(idx(item))});wrap.appendChild(card);
  const nm=document.createElement('div');nm.className='card-name';nm.textContent=item.title||'Untitled';nm.contentEditable=edit?'true':'false';nm.setAttribute('spellcheck','false');nm.addEventListener('input',()=>{item.title=nm.textContent;ds()});wrap.appendChild(nm);
  const catB=document.createElement('div');catB.className='card__cat';catB.textContent=item.cat||'Other';card.appendChild(catB);
  if(item.type==='video'){const b=document.createElement('div');b.className='card__badge';b.textContent='VIDEO';card.appendChild(b)}else if(item.imgs&&item.imgs.length>1){const b=document.createElement('div');b.className='card__badge';b.textContent=item.imgs.length+' IMG';card.appendChild(b)}
  const up=document.createElement('div');up.className='card__upload';up.innerHTML='<span>'+(item.type==='video'?'Replace':'＋ 添加图片')+'</span>';up.addEventListener('click',e=>{e.stopPropagation();pKey=item.id;if(item.type==='video'){pick('video/*',false,handleVideoFile)}else{if(!item.imgs)item.imgs=[item.id];pick('image/*',true,handlePhotoFiles)}});card.appendChild(up);
  const del=document.createElement('button');del.className='card__del';del.textContent='x';del.addEventListener('click',e=>{e.stopPropagation();removeItem(item)});card.appendChild(del);
  grid.appendChild(wrap)
}

async function loadMedia(){const raw=items();for(const item of raw){const ck=(item.imgs&&item.imgs.length)?item.imgs[0]:item.id;const blob=await dbGet(ck);if(!blob)continue;const url=URL.createObjectURL(blob);const card=document.querySelector('.card[data-id="'+item.id+'"]');if(!card)continue;const ph=card.querySelector('.card__ph');if(ph)ph.remove();const old=card.querySelector('img,video');if(old)old.remove();const el=document.createElement(item.type==='video'?'video':'img');el.src=url;if(item.type==='video'){el.muted=true;el.playsInline=true;el.preload='metadata'}el.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none';card.insertBefore(el,card.firstChild)}}

// === Stack Viewer ===
async function openStack(item){stackItem=item;renderStack();stack.classList.add('open');document.body.style.overflow='hidden'}
async function renderStack(){if(!stackItem)return;stackB.innerHTML='';const imgs=(stackItem.imgs&&stackItem.imgs.length)?stackItem.imgs:[stackItem.id];stackCnt.textContent=imgs.length+' 张';
  for(let j=0;j<imgs.length;j++){const key=imgs[j];
    if(edit){const ins=document.createElement('div');ins.className='stack-insert';ins.innerHTML='<span>+</span> Insert';ins.addEventListener('click',()=>{if(!stackItem.imgs)stackItem.imgs=[stackItem.id];const nk=stackItem.id+'_'+Date.now();stackItem.imgs.splice(j,0,nk);if(!data.mediaKeys.includes(nk))data.mediaKeys.push(nk);pKey=nk;save();pick('image/*',true,handleStackAdd)});stackB.appendChild(ins)}
    const wrap=document.createElement('div');wrap.className='stack-img-wrap';const blob=await dbGet(key);
    if(blob){const url=URL.createObjectURL(blob);const img=document.createElement('img');img.src=url;wrap.appendChild(img)}else{wrap.innerHTML='<div style="display:inline-block;aspect-ratio:4/3;min-width:200px;background:var(--s);color:var(--td);font-size:.7rem;padding:40px;">No Image</div>'}
    if(edit){const d=document.createElement('button');d.className='stack-img-del';d.textContent='x';d.addEventListener('click',e=>{e.stopPropagation();removeStackImg(j)});wrap.appendChild(d);const r=document.createElement('button');r.className='stack-img-rep';r.textContent='↻';r.addEventListener('click',e=>{e.stopPropagation();pKey=key;pick('image/*',false,handleReplaceOne)});wrap.appendChild(r)}
    stackB.appendChild(wrap)}
  if(edit){const ins=document.createElement('div');ins.className='stack-insert';ins.innerHTML='<span>+</span> Add More';ins.addEventListener('click',()=>{pKey=stackItem.id;pick('image/*',true,handleStackAdd)});stackB.appendChild(ins)}
}
function closeStack(){stack.classList.remove('open');stackB.innerHTML='';stackItem=null;document.body.style.overflow='';if(edit)render()}
document.getElementById('stackClose').addEventListener('click',closeStack);stack.addEventListener('click',e=>{if(e.target===stack)closeStack()});
async function removeStackImg(j){if(!stackItem)return;const imgs=stackItem.imgs&&stackItem.imgs.length?stackItem.imgs:[stackItem.id];if(imgs.length<=1){alert('至少保留一张图片');return}await dbDel(imgs[j]);data.mediaKeys=(data.mediaKeys||[]).filter(k=>k!==imgs[j]);imgs.splice(j,1);save();renderStack()}

// === Lightbox ===
function openLb(i){const all=items();if(!all.length)return;lbIdx=i;showLb();lbox.classList.add('open');document.body.style.overflow='hidden'}
async function showLb(){const item=items()[lbIdx];if(!item)return;lbInfo.querySelector('h3').textContent=item.title||'';lbInfo.querySelector('p').textContent=item.desc||'';lbCnt.textContent=(lbIdx+1)+' / '+items().length;const blob=await dbGet(item.id);if(!blob){lbCont.innerHTML='<span style="color:var(--td)">No media</span>';return}const url=URL.createObjectURL(blob);if(item.type==='video'){lbCont.innerHTML='<video src="'+url+'" controls autoplay playsinline style="max-width:92vw;max-height:85vh;border-radius:4px;"></video>'}else{lbCont.innerHTML='<img src="'+url+'" alt="">'}}
function closeLb(){lbox.classList.remove('open');lbCont.innerHTML='';document.body.style.overflow=''}
document.getElementById('lbClose').addEventListener('click',closeLb);document.getElementById('lbPrev').addEventListener('click',()=>{const all=items();lbIdx=((lbIdx-1)%all.length+all.length)%all.length;showLb()});document.getElementById('lbNext').addEventListener('click',()=>{const all=items();lbIdx=(lbIdx+1)%all.length;showLb()});lbox.addEventListener('click',e=>{if(e.target===lbox)closeLb()});

// === Upload Handlers ===
async function handlePhotoFiles(files){if(!files.length||!pKey)return;const item=(data.photos||[]).find(x=>x.id===pKey);if(!item)return;if(!item.imgs)item.imgs=[];for(const f of files){const ik=pKey+'_'+item.imgs.length;item.imgs.push(ik);const buf=await f.arrayBuffer();await dbSet(ik,new Blob([buf],{type:f.type}));if(!data.mediaKeys.includes(ik))data.mediaKeys.push(ik)}if(!item.title&&files.length)item.title=files[0].name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');item.type='image';save();if(stack.classList.contains('open')&&stackItem&&stackItem.id===pKey)renderStack();else render()}
async function handleVideoFile(files){if(!files.length||!pKey)return;const f=files[0];const buf=await f.arrayBuffer();const blob=new Blob([buf],{type:f.type});await dbSet(pKey,blob);if(!data.mediaKeys.includes(pKey)){data.mediaKeys.push(pKey);save()}const item=(data.videos||[]).find(x=>x.id===pKey);if(item&&!item.title){item.title=f.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');save()}render()}
async function handleReplace(files){if(!files.length||!pKey)return;const item=(data.photos||[]).find(x=>x.id===pKey)||(data.videos||[]).find(x=>x.id===pKey);if(!item)return;const old=(item.imgs&&item.imgs.length)?item.imgs:[item.id];for(const k of old)await dbDel(k);data.mediaKeys=(data.mediaKeys||[]).filter(k=>!old.includes(k));item.imgs=[];for(const f of files){const ik=pKey+'_'+item.imgs.length;item.imgs.push(ik);const buf=await f.arrayBuffer();await dbSet(ik,new Blob([buf],{type:f.type}));if(!data.mediaKeys.includes(ik))data.mediaKeys.push(ik)}if(!item.title&&files.length)item.title=files[0].name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');save();if(stack.classList.contains('open')&&stackItem&&stackItem.id===pKey)renderStack();else render()}
async function handleStackAdd(files){if(!files.length||!pKey)return;const item=(data.photos||[]).find(x=>x.id===pKey)||(data.photos||[]).find(x=>(x.imgs||[]).includes(pKey));if(!item)return;if(!item.imgs)item.imgs=[item.id];for(const f of files){const ik=item.id+'_'+item.imgs.length;item.imgs.push(ik);const buf=await f.arrayBuffer();await dbSet(ik,new Blob([buf],{type:f.type}));if(!data.mediaKeys.includes(ik))data.mediaKeys.push(ik)}save();if(stack.classList.contains('open')&&stackItem&&stackItem.id===item.id)renderStack();else render()}
async function handleReplaceOne(files){if(!files.length||!pKey)return;const f=files[0];const buf=await f.arrayBuffer();await dbSet(pKey,new Blob([buf],{type:f.type}));if(!data.mediaKeys.includes(pKey)){data.mediaKeys.push(pKey);save()}if(stack.classList.contains('open'))renderStack();else render()}

// === CRUD ===
function newItem(cat){const id=(tab==='photos'?'p_':'v_')+Date.now();const coll=tab==='photos'?data.photos:data.videos;coll.push({id,title:'',desc:'',type:tab==='photos'?'image':'video',cat:cat||cats()[0]||'其他'});save();if(tab==='photos'){pKey=id;pick('image/*',true,handlePhotoFiles)}else{pKey=id;pick('video/*',false,handleVideoFile)}}
async function removeItem(item){const all=items();if(!item)return;const keys=(item.imgs&&item.imgs.length)?item.imgs:[item.id];for(const k of keys)await dbDel(k);data.mediaKeys=(data.mediaKeys||[]).filter(k=>!keys.includes(k));all.splice(all.indexOf(item),1);save();renderCatTags();if(stack.classList.contains('open')&&stackItem&&stackItem.id===item.id)closeStack();else render()}

// === Tabs ===
document.querySelectorAll('.works-tab').forEach(btn=>{btn.addEventListener('click',()=>{tab=btn.dataset.tab;catFilter=null;document.querySelectorAll('.works-tab').forEach(b=>b.classList.toggle('active',b===btn));render();renderCatTags()})})

// === Category Tags ===
let catFilter=null;
function renderCatTags(){
  const container=document.getElementById('catTags');if(!container)return;
  const cs=cats();const raw=tab==='photos'?(data.photos||[]):(data.videos||[]);
  container.innerHTML='<span class="cat-tag'+(catFilter===null?' active':'')+'" data-cat="">全部<span class="cat-tag-count">'+raw.length+'</span></span>';
  cs.forEach(c=>{const n=raw.filter(x=>x.cat===c).length;if(!n&&!edit)return;const tag=document.createElement('span');tag.className='cat-tag'+(catFilter===c?' active':'');tag.setAttribute('data-cat',c);
    tag.innerHTML=esc(c)+'<span class="cat-tag-count">'+n+'</span>';
    if(edit){const del=document.createElement('span');del.className='cat-tag-del';del.textContent='×';del.title='删除分类';
      del.addEventListener('click',e=>{e.stopPropagation();if(!cats().includes(c))return;const arr=cats();if(arr.length<=1){alert('至少保留一个分类');return}arr.splice(arr.indexOf(c),1);items().forEach(item=>{if(item.cat===c)item.cat=arr[0]});if(catFilter===c)catFilter=null;save();render();renderCatTags()});
      tag.appendChild(del)}
    tag.addEventListener('dblclick',e=>{if(!edit)return;e.stopPropagation();const nw=prompt('重命名分类：',c);if(!nw||nw===c||cats().includes(nw))return;const arr=cats();arr[arr.indexOf(c)]=nw;items().forEach(item=>{if(item.cat===c)item.cat=nw});if(catFilter===c)catFilter=nw;save();render();renderCatTags()});
    container.appendChild(tag)});
  container.querySelectorAll('.cat-tag').forEach(t=>{t.addEventListener('click',()=>{catFilter=t.getAttribute('data-cat')||null;renderCatTags();render()})})
}

// === Categories ===
const catInput=document.getElementById('catInput');
document.getElementById('catAdd').addEventListener('click',()=>{const n=catInput.value.trim();if(!n||cats().includes(n))return;cats().push(n);catInput.value='';save();render();renderCatTags()});
catInput.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('catAdd').click()});
document.getElementById('catDel').addEventListener('click',()=>{const c=prompt('输入要删除的分类名称：');if(!c||!cats().includes(c))return;if(!confirm('确定删除分类「'+c+'」？相关项目将归入默认分类。'))return;const arr=cats();const idx=arr.indexOf(c);arr.splice(idx,1);items().forEach(item=>{if(item.cat===c)item.cat=cats()[0]||'其他'});if(catFilter===c)catFilter=null;save();render();renderCatTags()});
// Double-click to rename
content.addEventListener('dblclick',e=>{if(!edit)return;const h=e.target.closest('h2');if(!h)return;const old=h.textContent;const nw=prompt('重命名分类：',old);if(!nw||nw===old||cats().includes(nw))return;const arr=cats();const i=arr.indexOf(old);if(i>=0)arr[i]=nw;items().forEach(item=>{if(item.cat===old)item.cat=nw});if(catFilter===old)catFilter=nw;save();render();renderCatTags()});

// === Toolbar ===
document.getElementById('bAddPhoto').addEventListener('click',()=>{tab='photos';document.querySelectorAll('.works-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab==='photos'));newItem(cats()[0]||'其他')});
document.getElementById('bAddVideo').addEventListener('click',()=>{tab='videos';document.querySelectorAll('.works-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab==='videos'));newItem(cats()[0]||'其他')});
// Export
document.getElementById('bExport').addEventListener('click',async()=>{const exp=JSON.parse(JSON.stringify(data));const keys=new Set([...(exp.mediaKeys||[])]);exp.photos.forEach(x=>{(x.imgs&&x.imgs.length?x.imgs:[x.id]).forEach(k=>keys.add(k))});exp.videos.forEach(x=>keys.add(x.id));for(const k of keys){const blob=await dbGet(k);if(blob)exp['_m_'+k]={type:blob.type,data:await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result.split(',')[1]);r.readAsDataURL(blob)})}}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(exp,null,2)],{type:'application/json'}));a.download='backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href)});
// Import
document.getElementById('bImport').addEventListener('click',()=>document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const imp=JSON.parse(await f.text());const nk=[];for(const k of Object.keys(imp)){if(k.startsWith('_m_')){const mk=k.slice(3);const{type,data:b64}=imp[k];const bin=atob(b64);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);await dbSet(mk,new Blob([bytes],{type}));nk.push(mk);delete imp[k]}}imp.mediaKeys=nk;if(!imp.photos)imp.photos=[];if(!imp.videos)imp.videos=[];if(!imp.photoCats||!imp.photoCats.length)imp.photoCats=['摄影','设计','人像','其他'];
    if(!imp.videoCats||!imp.videoCats.length)imp.videoCats=['短片','广告','纪录片','其他'];data=imp;save();applyText();render();renderAbout();renderCatTags();if(edit)toggleEdit();alert('导入成功！')}catch(err){alert('导入失败，文件格式不正确');console.error(err)}});
// Reset
document.getElementById('bReset').addEventListener('click',async()=>{if(!confirm('确定重置所有数据？此操作不可撤销！'))return;const db=await odb();await new Promise(ok=>{const t=db.transaction(S,'readwrite');t.objectStore(S).clear();t.oncomplete=ok});localStorage.removeItem('pf_data2');localStorage.removeItem('pf_pw');sessionStorage.removeItem('pf_auth');location.reload()});

// === Nav ===
document.getElementById('navToggle').addEventListener('click',()=>{document.getElementById('navToggle').classList.toggle('open');document.getElementById('navLinks').classList.toggle('open')});
document.querySelectorAll('.nav__links a').forEach(a=>a.addEventListener('click',()=>{document.getElementById('navToggle').classList.remove('open');document.getElementById('navLinks').classList.remove('open')}));
document.querySelectorAll('section[id]').forEach(s=>new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)document.querySelectorAll('.nav__links a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))})},{rootMargin:'-40% 0px -40% 0px'}).observe(s));

// === Keyboard ===
document.addEventListener('keydown',e=>{if(e.target.contentEditable==='true'||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;if(lbox.classList.contains('open')){if(e.key==='ArrowLeft'){const all=items();lbIdx=((lbIdx-1)%all.length+all.length)%all.length;showLb()}if(e.key==='ArrowRight'){const all=items();lbIdx=(lbIdx+1)%all.length;showLb()}if(e.key==='Escape')closeLb()}if(stack.classList.contains('open')&&e.key==='Escape')closeStack()});

// === About Rendering ===
function renderAbout(){
  // Profile card fields
  if(!data.profile)data.profile={name:data.aboutName||'张伟',title:data.aboutTagline||'摄影师 / 视觉艺术家',bio:data.aboutBio||''};
  document.querySelectorAll('[data-pf]').forEach(el=>{const k=el.getAttribute('data-pf');if(data.profile[k]!==undefined)el.value=data.profile[k];el.readOnly=!edit});
  // Avatar in profile card
  const avLg=document.getElementById('aboutAvatarLg');const phLg=document.getElementById('avatarPlaceholderLg');
  if(avLg&&phLg){if(data.aboutAvatar){avLg.src=data.aboutAvatar;avLg.style.display='';phLg.style.display='none'}else{avLg.style.display='none';phLg.style.display=''}}
  // Also update header avatar
  const av=document.getElementById('aboutAvatar');const ph=document.getElementById('avatarPlaceholder');
  if(av&&ph){if(data.aboutAvatar){av.src=data.aboutAvatar;av.style.display='';ph.style.display='none'}else{av.style.display='none';ph.style.display=''}}
  // Timelines
  const wtl=document.getElementById('workTimeline');const etl=document.getElementById('eduTimeline');
  if(wtl)renderTimeline(wtl,data.workExperience||[],'work');
  if(etl)renderTimeline(etl,data.education||[],'edu');
}

function setAboutEditable(on){
  document.querySelectorAll('[data-pf]').forEach(el=>{el.readOnly=!on})
}

// Profile field input handler
document.addEventListener('input',e=>{if(!edit)return;const el=e.target.closest('[data-pf]');if(!el)return;const k=el.getAttribute('data-pf');if(!data.profile)data.profile={};data.profile[k]=el.value;ds()});

// Profile avatar click
const pfAvatar=document.getElementById('profileAvatarLg');
if(pfAvatar){pfAvatar.addEventListener('click',()=>{if(!edit)return;pick('image/*',false,async files=>{if(!files.length)return;const f=files[0];const reader=new FileReader();reader.onload=()=>{data.aboutAvatar=reader.result;save();renderAbout()};reader.readAsDataURL(f)})})}
function renderTimeline(container,entries,type){
  if(!container)return;container.innerHTML='';entries.forEach((e,i)=>{
    const div=document.createElement('div');div.className='timeline-entry reveal';
    div.innerHTML='<div class="timeline-entry-header"><span class="timeline-entry-title">'+esc(e.title||'')+'</span><span class="timeline-entry-period">'+esc(e.period||'')+'</span></div><div class="timeline-entry-sub">'+esc(e.sub||'')+'</div><div class="timeline-entry-desc">'+esc(e.desc||'')+'</div>';
    if(edit){const del=document.createElement('button');del.className='timeline-entry-del';del.textContent='x';del.addEventListener('click',(ev)=>{ev.stopPropagation();entries.splice(i,1);save();renderAbout()});div.appendChild(del);const ed=document.createElement('button');ed.className='timeline-entry-edit';ed.textContent='✎';ed.addEventListener('click',(ev)=>{ev.stopPropagation();openTimelineModal(entries,i,type)});div.appendChild(ed)}
    container.appendChild(div)})
}
// Avatar upload - store original quality
const avWrap=document.getElementById('avatarWrapper');if(avWrap){avWrap.addEventListener('click',()=>{if(!edit)return;pick('image/*',false,async files=>{if(!files.length)return;const f=files[0];const reader=new FileReader();reader.onload=()=>{data.aboutAvatar=reader.result;save();renderAbout()};reader.readAsDataURL(f)})})}

// === Timeline Modal ===
const tlModal=document.getElementById('timelineModal'),tlTitle=document.getElementById('timelineModalTitle');
let tlTarget=null,tlIdx=-1,tlType='';
function openTimelineModal(arr,idx,type){tlTarget=arr;tlIdx=idx;tlType=type;const e=arr[idx];tlTitle.textContent=(type==='work'?'编辑工作经历':'编辑教育经历');document.getElementById('tleTitle').value=e.title||'';document.getElementById('tleSub').value=e.sub||'';document.getElementById('tlePeriod').value=e.period||'';document.getElementById('tleDesc').value=e.desc||'';tlModal.classList.add('open')}
function closeTimelineModal(){tlModal.classList.remove('open');tlTarget=null}
document.getElementById('tleCancel').addEventListener('click',closeTimelineModal);
document.getElementById('tleSave').addEventListener('click',()=>{if(!tlTarget)return;const e=tlTarget[tlIdx];e.title=document.getElementById('tleTitle').value.trim();e.sub=document.getElementById('tleSub').value.trim();e.period=document.getElementById('tlePeriod').value.trim();e.desc=document.getElementById('tleDesc').value.trim();save();renderAbout();closeTimelineModal()});
tlModal.addEventListener('click',ev=>{if(ev.target===tlModal)closeTimelineModal()});
// Add timeline entries
document.getElementById('addWorkBtn').addEventListener('click',()=>{if(!edit)return;data.workExperience.push({title:'新公司',sub:'职位',period:'2024 - 至今',desc:'工作描述...'});save();renderAbout();openTimelineModal(data.workExperience,data.workExperience.length-1,'work')});
document.getElementById('addEduBtn').addEventListener('click',()=>{if(!edit)return;data.education.push({title:'新学校',sub:'专业',period:'2020 - 2024',desc:'学习经历...'});save();renderAbout();openTimelineModal(data.education,data.education.length-1,'edu')});
// Close modal on Escape
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tlModal.classList.contains('open')){closeTimelineModal()}});

// === Particle System ===
function initParticles(){
  const canvas=document.getElementById('particleCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');
  const isMobile=window.innerWidth<768;const prefersReduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(prefersReduced){canvas.style.display='none';return}
  const count=isMobile?60:140;const colors=['rgba(167,139,250,','rgba(96,165,250,','rgba(244,114,182,','rgba(52,211,153,','rgba(251,191,36,'];
  let w,h,particles=[],mouse={x:-999,y:-999,down:false};
  function resize(){w=canvas.width=window.innerWidth;h=canvas.height=window.innerHeight}
  resize();window.addEventListener('resize',()=>{resize();initParts()});
  function initParts(){particles=[];for(let i=0;i<count;i++){const ci=Math.floor(Math.random()*colors.length);particles.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8,r:Math.random()*2.5+1.5,color:colors[ci],opacity:Math.random()*.4+.3,phase:Math.random()*Math.PI*2})}}
  initParts();
  document.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.down=false});
  document.addEventListener('touchmove',e=>{if(e.touches.length){mouse.x=e.touches[0].clientX;mouse.y=e.touches[0].clientY}},{passive:true});
  document.addEventListener('click',e=>{burst(e.clientX,e.clientY)});
  function burst(bx,by){const n=14;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2;const s=Math.random()*4+2;const ci=Math.floor(Math.random()*colors.length);particles.push({x:bx,y:by,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:Math.random()*2+1,color:colors[ci],opacity:.7+.3*Math.random(),phase:0,life:60+Math.random()*40})}}
  let animId;
  function loop(ts){
    if(document.hidden){animId=requestAnimationFrame(loop);return}
    ctx.clearRect(0,0,w,h);const t=ts*.001;
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      if(p.life!==undefined){p.life--;p.opacity-=.008;if(p.life<=0||p.opacity<=0){particles.splice(i,1);continue}}
      p.x+=p.vx;p.y+=p.vy;if(p.x<-20)p.x=w+20;if(p.x>w+20)p.x=-20;if(p.y<-20)p.y=h+20;if(p.y>h+20)p.y=-20;
      const dx=mouse.x-p.x,dy=mouse.y-p.y,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200&&mouse.x>-100){const f=(200-dist)/200*.06;p.vx+=dx/dist*f;p.vy+=dy/dist*f}
      const v=Math.sqrt(p.vx*p.vx+p.vy*p.vy);if(v>2){p.vx=p.vx/v*2;p.vy=p.vy/v*2}
      const r=p.r*(1+Math.sin(t*2+p.phase)*.2);ctx.beginPath();const grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*3);grad.addColorStop(0,p.color+(p.opacity)+')');grad.addColorStop(.4,p.color+(p.opacity*.6)+')');grad.addColorStop(1,p.color+'0)');ctx.fillStyle=grad;ctx.arc(p.x,p.y,r*3,0,Math.PI*2);ctx.fill()
    }
    if(!isMobile)drawConnections();
    animId=requestAnimationFrame(loop)
  }
  function drawConnections(){const maxD=130;for(let i=0;i<particles.length;i++){for(let j=i+1;j<particles.length;j++){const a=particles[i],b=particles[j];if(a.life!==undefined||b.life!==undefined)continue;const dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);if(d<maxD){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='rgba(167,139,250,'+((maxD-d)/maxD*.1)+')';ctx.lineWidth=.5;ctx.stroke()}}}}
  animId=requestAnimationFrame(loop)
}

// === Scroll Reveal ===
function initScrollReveal(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}})},{threshold:.15,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  // Observe new reveals added later
  new MutationObserver(()=>{document.querySelectorAll('.reveal:not([data-reveal-observed])').forEach(el=>{el.setAttribute('data-reveal-observed','1');obs.observe(el)})}).observe(document.body,{childList:true,subtree:true})
}

// === Card 3D Tilt (disabled by user request) ===
// function initCardTilt(){ ... }

// === Drag Drop ===
function initDragDrop(){
  const overlay=document.getElementById('dropOverlay');if(!overlay)return;let dragCount=0;
  document.addEventListener('dragenter',e=>{e.preventDefault();dragCount++;overlay.classList.add('active')});
  document.addEventListener('dragleave',()=>{dragCount--;if(dragCount<=0){dragCount=0;overlay.classList.remove('active')}});
  document.addEventListener('dragover',e=>{e.preventDefault()});
  document.addEventListener('drop',e=>{e.preventDefault();dragCount=0;overlay.classList.remove('active');const files=e.dataTransfer.files;if(!files.length)return;if(!edit){if(!auth&&localStorage.getItem('pf_pw')){openPw();return}toggleEdit()}handleDropFiles(files)})
}
async function handleDropFiles(files){
  const valid=[];for(const f of files){if(f.type.startsWith('image/')||f.type.startsWith('video/'))valid.push(f)}
  if(!valid.length){alert('只支持图片和视频文件');return}
  showUploadProgress(valid.length);
  for(let i=0;i<valid.length;i++){const f=valid[i];updateUploadProgress(i+1,valid.length,f.name);const isVideo=f.type.startsWith('video/');const cat=cats()[0]||'其他';const id=(isVideo?'v_':'p_')+Date.now()+'_'+i;const buf=await f.arrayBuffer();const blob=new Blob([buf],{type:f.type});await dbSet(id,blob);if(!data.mediaKeys.includes(id))data.mediaKeys.push(id);
    if(isVideo){data.videos.push({id,title:f.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' '),desc:'',type:'video',cat});try{const thumb=await captureVideoThumb(blob);if(thumb){const thumbKey=id+'_thumb';await dbSet(thumbKey,dataURLtoBlob(thumb));data.mediaKeys.push(thumbKey);const item=data.videos.find(x=>x.id===id);if(item)item.thumbKey=thumbKey}}catch(e){}}
    else{data.photos.push({id,title:f.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' '),desc:'',type:'image',cat,imgs:[id]})}
  }
  save();render();hideUploadProgress()
}
function showUploadProgress(total){const el=document.getElementById('uploadProgress');if(el){el.classList.add('active');document.getElementById('uploadProgressText').textContent='上传中 0/'+total}}
function updateUploadProgress(cur,total,name){const el=document.getElementById('uploadProgressFill');const txt=document.getElementById('uploadProgressText');const fn=document.getElementById('uploadProgressFile');if(el)el.style.width=(cur/total*100)+'%';if(txt)txt.textContent='上传中 '+cur+'/'+total;if(fn)fn.textContent=name}
function hideUploadProgress(){setTimeout(()=>{const el=document.getElementById('uploadProgress');if(el)el.classList.remove('active')},800)}
function dataURLtoBlob(dataurl){const parts=dataurl.split(',');const mime=parts[0].match(/:(.*?);/)[1];const raw=atob(parts[1]);const u8=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)u8[i]=raw.charCodeAt(i);return new Blob([u8],{type:mime})}
async function captureVideoThumb(blob){return new Promise(ok=>{const url=URL.createObjectURL(blob);const vid=document.createElement('video');vid.preload='metadata';vid.muted=true;vid.playsInline=true;vid.currentTime=1;vid.addEventListener('loadeddata',()=>{vid.currentTime=1});vid.addEventListener('seeked',()=>{try{const c=document.createElement('canvas');c.width=vid.videoWidth||320;c.height=vid.videoHeight||180;const ctx=c.getContext('2d');ctx.drawImage(vid,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.7))}catch(e){ok(null)}URL.revokeObjectURL(url)});vid.addEventListener('error',()=>{ok(null);URL.revokeObjectURL(url)});vid.src=url;setTimeout(()=>ok(null),5000)})}

// === Search Filter ===
function initSearch(){
  const input=document.getElementById('searchInput');if(!input)return;
  input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();filterItems(q)})
}
function filterItems(q){
  const raw=items();const filtered=q?raw.filter(item=>(item.title||'').toLowerCase().includes(q)||(item.desc||'').toLowerCase().includes(q)||(item.cat||'').toLowerCase().includes(q)):raw;
  const groups={};cats().forEach(c=>{groups[c]=[]});
  filtered.forEach(item=>{const c=item.cat||cats()[0]||'其他';if(!groups[c])groups[c]=[];groups[c].push(item)});
  content.innerHTML='';let fi=0;Object.keys(groups).forEach(cat=>{const its=groups[cat];if(!its.length&&!edit)return;const sec=document.createElement('div');sec.className='cat-section';const hdr=document.createElement('div');hdr.className='cat-header';hdr.innerHTML='<span class="cat-num">'+(fi+1).toString().padStart(2,'0')+'</span><h2 class="cat-title">'+esc(cat)+'</h2><span class="cat-count">'+its.length+' items</span>';sec.appendChild(hdr);fi++;if(its.length){const grid=document.createElement('div');grid.className='item-grid';its.forEach(item=>renderCard(item,grid));if(edit&&!q){const add=document.createElement('div');add.className='card card--add';add.innerHTML='<span>+</span>Add to '+esc(cat);add.addEventListener('click',()=>newItem(cat));grid.appendChild(add)}sec.appendChild(grid)}else if(edit){const add=document.createElement('div');add.className='card card--add';add.style.cssText='display:flex;aspect-ratio:auto;min-height:50px;margin:0 auto;max-width:400px';add.innerHTML='<span>+</span>添加作品到 '+esc(cat);add.addEventListener('click',()=>newItem(cat));sec.appendChild(add)}content.appendChild(sec)});loadMedia()
}

// === Item Ordering ===
function moveItem(item,dir){const coll=items();const i=coll.indexOf(item);if(i<0)return;const j=i+dir;if(j<0||j>=coll.length)return;coll.splice(i,1);coll.splice(j,0,item);save();render()}

// === Typing Text ===
let typingTimer=null;
function initTypingText(){
  const el=document.getElementById('typingText');const p=el?.parentElement;if(!el||!p)return;
  if(edit){el.textContent=data.heroSub||'';el.style.borderRight='none';return}
  el.style.borderRight='2px solid var(--accent)';
  const texts=[data.heroSub||'创意视觉设计师'];try{const extra=['创意视觉设计师','UI/UX 设计师','品牌设计师','插画艺术家','视觉传达设计师'];if(!texts.includes(extra[0]))texts.push(...extra)}catch(e){}
  let ti=0,ci=0,isDeleting=false;
  function tick(){if(edit){el.textContent=data.heroSub||'';el.style.borderRight='none';return}
    const txt=texts[ti%texts.length];if(isDeleting){ci--;el.textContent=txt.substring(0,ci);if(ci<=0){isDeleting=false;ti++;typingTimer=setTimeout(tick,400);return}else{typingTimer=setTimeout(tick,35)}}else{ci++;el.textContent=txt.substring(0,ci);if(ci>=txt.length){typingTimer=setTimeout(()=>{isDeleting=true;tick()},2500);return}else{typingTimer=setTimeout(tick,80+Math.random()*60)}}}
  typingTimer=setTimeout(tick,600)
}

// === Enhanced Card Render (with order buttons) ===
const origRenderCard=renderCard;
renderCard=function(item,grid){
  origRenderCard(item,grid);
  if(!edit)return;
  const card=grid.querySelector('.card[data-id="'+item.id+'"]');if(!card)return;
  const up=document.createElement('button');up.className='card__up';up.textContent='▲';up.title='上移';up.addEventListener('click',e=>{e.stopPropagation();moveItem(item,-1)});card.appendChild(up);
  const down=document.createElement('button');down.className='card__down';down.textContent='▼';down.title='下移';down.addEventListener('click',e=>{e.stopPropagation();moveItem(item,1)});card.appendChild(down)
};

// === Esc helper for edit mode ===
const esc=s=>{const d=document.createElement('div');d.textContent=s||'';return d.innerHTML};

// === Preload from data.js ===
async function preloadIfEmpty(){
  if(localStorage.getItem('pf_data2'))return false; // Already have data
  if(!window.__PRELOAD__)return false;
  try{
    const d=JSON.parse(JSON.stringify(window.__PRELOAD__));
    // Restore media to IndexedDB
    const nk=[];
    for(const k of Object.keys(d)){
      if(k.startsWith('_m_')){
        const mk=k.slice(3);const{type,data:b64}=d[k];
        const bin=atob(b64);const bytes=new Uint8Array(bin.length);
        for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
        await dbSet(mk,new Blob([bytes],{type}));nk.push(mk);delete d[k];
      }
    }
    d.mediaKeys=nk;
    if(!d.photos)d.photos=[];if(!d.videos)d.videos=[];
    if(!d.photoCats||!d.photoCats.length)d.photoCats=['环艺作品','平面设计作品','AIGC作品','品牌设计','UI/UX设计','插画作品','摄影作品','包装设计','C4D/3D','其他'];
    if(!d.videoCats||!d.videoCats.length)d.videoCats=['品牌广告','产品动画','Motion设计','3D短片','宣传片','纪录片','短视频','其他'];
    if(!d.profile)d.profile={name:'张伟',title:'摄影师 / 视觉艺术家',bio:''};
    if(!d.workExperience)d.workExperience=[];if(!d.education)d.education=[];
    localStorage.setItem('pf_data2',JSON.stringify(d));
    return true;
  }catch(e){console.error('Preload failed:',e);return false}
}

// === Init ===
async function init(){
  const preloaded=await preloadIfEmpty();
  data=load();applyText();render();renderAbout();renderCatTags();initParticles();initScrollReveal();initDragDrop();initSearch();initTypingText();if(auth)showAu();if(!localStorage.getItem('pf_pw'))pwHint.textContent='设置密码后可保护编辑权限'
}
init();
});
