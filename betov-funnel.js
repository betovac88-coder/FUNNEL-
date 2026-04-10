'use strict';
'use strict';

/* ══════════════════════════════════════
   PERSISTENCIA — localStorage
   Todo queda guardado aunque recargues
══════════════════════════════════════ */

const STORAGE_KEY = 'betovFunnel_v1';

/* ── COMPRIMIR IMAGEN ANTES DE GUARDAR ── */
function comprimirImg(src, maxW, calidad) {
  return new Promise(resolve => {
    if (!src || !src.startsWith('data:')) { resolve(src); return; }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', calidad));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

async function recolectarDatos() {
  const data = {
    videos: vData,
    fotos: fData,
    fotoSlots: {},
    thumbs: {},
    textos: {
      badge:       document.getElementById('edit-badge')?.innerText || '',
      h1l1:        document.getElementById('h1-l1')?.innerText || '',
      h1l2:        document.getElementById('h1-l2')?.innerText || '',
      h1l3:        document.getElementById('h1-l3')?.innerText || '',
      sub:         document.getElementById('edit-sub')?.innerText || '',
      proof:       document.getElementById('edit-proof')?.innerText || '',
      ctaText:     document.getElementById('edit-cta-text')?.innerText || '',
      ctaP:        document.getElementById('edit-cta-p')?.innerText || '',
      transAltura: document.getElementById('trans-altura-range')?.value || '280',
    }
  };

  // Sliders y posiciones casos con video
  for (let i = 0; i < 6; i++) {
    const rangeEl = document.getElementById(`altura-range-${i}`);
    const posX    = document.getElementById(`pos-x-${i}`);
    const posY    = document.getElementById(`pos-y-${i}`);
    if (rangeEl) data.fotoSlots[`altura-${i}`] = rangeEl.value;
    if (posX)    data.fotoSlots[`pos-x-${i}`]  = posX.value;
    if (posY)    data.fotoSlots[`pos-y-${i}`]  = posY.value;

    for (const tipo of ['antes','despues']) {
      const img  = document.getElementById(`vfimg-${i}-${tipo}`);
      const slot = document.getElementById(`vf-${i}-${tipo}`);
      if (img && img.src && img.src.startsWith('data:')) {
        // Comprimir a max 600px ancho, calidad 0.65
        data.fotoSlots[`${i}-${tipo}`] = await comprimirImg(img.src, 600, 0.65);
      }
      if (img && img.style.objectPosition)
        data.fotoSlots[`${i}-${tipo}-pos`] = img.style.objectPosition;
      if (slot && slot.style.height)
        data.fotoSlots[`${i}-${tipo}-height`] = slot.style.height;
    }
  }

  // Controles de transformaciones
  for (let i = 0; i < 6; i++) {
    const fh  = document.getElementById(`fh-${i}`);
    const fx  = document.getElementById(`fx-${i}`);
    const fy  = document.getElementById(`fy-${i}`);
    const img = document.getElementById(`fimg-${i}`);
    if (fh) data.fotoSlots[`fh-${i}`] = fh.value;
    if (fx) data.fotoSlots[`fx-${i}`] = fx.value;
    if (fy) data.fotoSlots[`fy-${i}`] = fy.value;
    if (img && img.style.objectPosition)
      data.fotoSlots[`fpos-${i}`] = img.style.objectPosition;
    if (img && img.src && img.src.startsWith('data:'))
      data.fotoSlots[`fimg-${i}`] = await comprimirImg(img.src, 600, 0.65);
  }

  // Thumbnails
  for (let i = 0; i < 5; i++) {
    const th = document.getElementById(`vthumb-${i}`);
    if (th && th.src && th.src.startsWith('data:'))
      data.thumbs[`${i}`] = await comprimirImg(th.src, 400, 0.6);
  }

  return data;
}

function guardarTodo() {
  // Guardar solo textos y ajustes en localStorage (sin imágenes — son muy pesadas)
  const textos = {
    badge:       document.getElementById('edit-badge')?.innerText || '',
    h1l1:        document.getElementById('h1-l1')?.innerText || '',
    h1l2:        document.getElementById('h1-l2')?.innerText || '',
    h1l3:        document.getElementById('h1-l3')?.innerText || '',
    sub:         document.getElementById('edit-sub')?.innerText || '',
    proof:       document.getElementById('edit-proof')?.innerText || '',
    ctaText:     document.getElementById('edit-cta-text')?.innerText || '',
    ctaP:        document.getElementById('edit-cta-p')?.innerText || '',
    transAltura: document.getElementById('trans-altura-range')?.value || '280',
    videos:      vData,
    fotos:       fData,
  };
  try { localStorage.setItem(STORAGE_KEY + '_textos', JSON.stringify(textos)); } catch(e) {}
}

async function exportarDatos() {
  showToast('⏳ Preparando archivo...');
  const data = await recolectarDatos();
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'betov-funnel-datos.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 ¡Archivo guardado! Guardalo en un lugar seguro.');
}

function restaurarTodo() {
  try {
    // Intentar restaurar desde .json importado primero
    const rawFull = localStorage.getItem(STORAGE_KEY);
    if (rawFull) {
      const data = JSON.parse(rawFull);
      restaurarDesdeData(data);
      showToast('📂 Datos restaurados');
      return;
    }
    // Si no hay .json, restaurar textos guardados livianamente
    const rawTextos = localStorage.getItem(STORAGE_KEY + '_textos');
    if (!rawTextos) return;
    const t = JSON.parse(rawTextos);
    if (t.badge)   setEl('edit-badge', t.badge);
    if (t.h1l1)    setEl('h1-l1', t.h1l1);
    if (t.h1l2)    setEl('h1-l2', t.h1l2);
    if (t.h1l3)    setEl('h1-l3', t.h1l3);
    if (t.sub)     setEl('edit-sub', t.sub);
    if (t.proof)   setEl('edit-proof', t.proof);
    if (t.ctaText) setEl('edit-cta-text', t.ctaText);
    if (t.ctaP)    setEl('edit-cta-p', t.ctaP);
    if (t.transAltura) {
      const r = document.getElementById('trans-altura-range');
      const l = document.getElementById('trans-altura-val');
      if (r) r.value = t.transAltura;
      if (l) l.textContent = t.transAltura + 'px';
      document.querySelectorAll('.fcaso-media').forEach(el => el.style.height = t.transAltura + 'px');
    }
    if (t.videos) t.videos.forEach((v, i) => {
      if (i < vData.length) { vData[i]={...vData[i],...v}; if(v.nombre) setEl(`vname-${i}`,v.nombre); if(v.result) setEl(`vresult-${i}`,v.result); if(v.desc) setEl(`vdesc-${i}`,v.desc); }
    });
    if (t.fotos) t.fotos.forEach((f, i) => {
      if (i < fData.length) { fData[i]={...fData[i],...f}; if(f.nombre) setEl(`fname-${i}`,f.nombre); if(f.result) setEl(`fresult-${i}`,f.result); if(f.desc) setEl(`fdesc-${i}`,f.desc); }
    });
  } catch(e) { console.error('Error restaurando:', e); }
}

function restaurarDesdeData(data) {
  if (data.textos) {
    const t = data.textos;
    if (t.badge)   setEl('edit-badge', t.badge);
    if (t.h1l1)    setEl('h1-l1', t.h1l1);
    if (t.h1l2)    setEl('h1-l2', t.h1l2);
    if (t.h1l3)    setEl('h1-l3', t.h1l3);
    if (t.sub)     setEl('edit-sub', t.sub);
    if (t.proof)   setEl('edit-proof', t.proof);
    if (t.ctaText) setEl('edit-cta-text', t.ctaText);
    if (t.ctaP)    setEl('edit-cta-p', t.ctaP);
    if (t.transAltura) {
      const r = document.getElementById('trans-altura-range');
      const l = document.getElementById('trans-altura-val');
      if (r) r.value = t.transAltura;
      if (l) l.textContent = t.transAltura + 'px';
      document.querySelectorAll('.fcaso-media').forEach(el => el.style.height = t.transAltura + 'px');
    }
  }
  if (data.videos) data.videos.forEach((v,i) => {
    if (i >= vData.length) return;
    vData[i]={...vData[i],...v};
    if(v.nombre) setEl(`vname-${i}`,v.nombre);
    if(v.result) setEl(`vresult-${i}`,v.result);
    if(v.desc)   setEl(`vdesc-${i}`,v.desc);
  });
  if (data.thumbs) Object.entries(data.thumbs).forEach(([idx,src]) => {
    const th=document.getElementById(`vthumb-${idx}`); if(th&&src) th.src=src;
  });
  if (data.fotoSlots) Object.entries(data.fotoSlots).forEach(([key,val]) => {
    if (!val) return;
    if (key.startsWith('altura-')) {
      const idx=key.replace('altura-','');
      const r=document.getElementById(`altura-range-${idx}`); if(r) r.value=val;
      const l=document.getElementById(`altura-val-${idx}`); if(l) l.textContent=val+'px';
      for (const t of ['antes','despues']) { const s=document.getElementById(`vf-${idx}-${t}`); if(s) s.style.height=val+'px'; }
      return;
    }
    if (key.startsWith('pos-x-')) { const idx=key.replace('pos-x-',''); const el=document.getElementById(`pos-x-${idx}`); if(el){el.value=val; setPosicion(parseInt(idx));} return; }
    if (key.startsWith('pos-y-')) { const idx=key.replace('pos-y-',''); const el=document.getElementById(`pos-y-${idx}`); if(el){el.value=val; setPosicion(parseInt(idx));} return; }
    if (key.endsWith('-pos') && !key.startsWith('f')) { const p=key.replace('-pos','').split('-'); if(p.length===2){const img=document.getElementById(`vfimg-${p[0]}-${p[1]}`); if(img) img.style.objectPosition=val;} return; }
    if (key.endsWith('-height')) { const p=key.replace('-height','').split('-'); if(p.length===2){const s=document.getElementById(`vf-${p[0]}-${p[1]}`); if(s) s.style.height=val;} return; }
    if (key.startsWith('fh-')) { const idx=key.replace('fh-',''); const m=document.getElementById(`fmedia-${idx}`); if(m) m.style.height=val+'px'; const l=document.getElementById(`fh-val-${idx}`); if(l) l.textContent=val+'px'; const el=document.getElementById(`fh-${idx}`); if(el) el.value=val; return; }
    if (key.startsWith('fx-')) { const idx=key.replace('fx-',''); const el=document.getElementById(`fx-${idx}`); if(el){el.value=val; setFcasoPos(parseInt(idx));} return; }
    if (key.startsWith('fy-')) { const idx=key.replace('fy-',''); const el=document.getElementById(`fy-${idx}`); if(el){el.value=val; setFcasoPos(parseInt(idx));} return; }
    if (key.startsWith('fpos-')) { const idx=key.replace('fpos-',''); const img=document.getElementById(`fimg-${idx}`); if(img) img.style.objectPosition=val; return; }
    if (key.startsWith('fimg-')) { const idx=key.replace('fimg-',''); const img=document.getElementById(`fimg-${idx}`); if(img&&val) img.src=val; return; }
    const p=key.split('-');
    if (p.length===2) {
      const img=document.getElementById(`vfimg-${p[0]}-${p[1]}`);
      const slot=document.getElementById(`vf-${p[0]}-${p[1]}`);
      if(img&&slot&&val){ img.src=val; img.style.objectFit='cover'; slot.classList.add('has-img'); const r=document.getElementById(`altura-range-${p[0]}`); if(r) slot.style.height=r.value+'px'; }
    }
  });
  if (data.fotos) data.fotos.forEach((f,i) => {
    if (i>=fData.length) return;
    fData[i]={...fData[i],...f};
    if(f.nombre) setEl(`fname-${i}`,f.nombre);
    if(f.result) setEl(`fresult-${i}`,f.result);
    if(f.desc)   setEl(`fdesc-${i}`,f.desc);
  });
}

/* ── IMPORTAR — restaura desde un archivo .json ── */
function importarDatos() {
  document.getElementById('import-file-input').click();
}

function handleImport(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      // Guardar en localStorage para persistir
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(err) {}
      // Aplicar directo sin recargar
      restaurarDesdeData(data);
      showToast('✅ Datos importados correctamente');
    } catch(err) {
      alert('Error al leer el archivo. Asegurate de usar el archivo .json exportado desde el funnel.');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

/* ── DATOS ── */
const vData=[
  {url:'',nombre:'Valentín Pontieli',result:'−8 kg en 60 días',desc:'Nunca creí que el peso corporal fuera suficiente. BetoV me demostró que estaba equivocado.'},
  {url:'',nombre:'Sebastián Álvarez',result:'−10 kg en 70 días',desc:'Llevaba años queriendo cambiar su cuerpo. Con el método BetoV lo logró en menos de 3 meses.'},
  {url:'',nombre:'Bruno Oviedo',result:'−10 kg en 75 días',desc:'Entrenando desde su casa logró el cuerpo que quería sin pisar un gimnasio.'},
  {url:'',nombre:'Andrés Ovispo',result:'−12 kg en 90 días',desc:'Los 12 kilos que no pude bajar en años los bajé en 3 meses entrenando 40 min al día.'},
  {url:'',nombre:'Leo Contessi',result:'−11 kg en 85 días',desc:'Siguió el método al pie de la letra. Sin excusas, sin gimnasio. Los resultados hablan solos.'}
];
const fData=[
  {nombre:'Juan M.',result:'−11 kg · 80 días',desc:'De no poder hacer una flexión a series completas con perfecta técnica.'},
  {nombre:'Marcos T.',result:'−7 kg · 60 días',desc:'40 min al día desde su casa. Dos meses de trabajo, resultado para siempre.'},
  {nombre:'Diego F.',result:'−9 kg · 75 días',desc:'Probó mil dietas. El método BetoV fue lo único que le funcionó de verdad.'},
  {nombre:'Gastón R.',result:'−6 kg · 45 días',desc:'Resultados visibles en solo 6 semanas con el método correcto.'},
  {nombre:'Nicolás T.',result:'−12 kg · 90 días',desc:'12 kilos exactos en 90 días sin pisar el gimnasio ni una sola vez.'},
  {nombre:'Pablo L.',result:'−8 kg · 70 días',desc:'Sin equipos, sin excusas. Solo peso corporal y el método correcto.'},
  {nombre:'Gustavo B.',result:'−10 kg · 85 días',desc:'45 años y cero experiencia. La edad no es excusa con el método correcto.'},
  {nombre:'Fernando C.',result:'−7 kg · 55 días',desc:'Viaja por trabajo. El método BetoV se adapta a cualquier lugar del mundo.'}
];

/* ── PLAY BUTTON VSL ── */
function startVsl() {
  const overlay = document.getElementById('vsl-play-overlay');
  const iframe  = document.getElementById('vsl-wistia-iframe');
  // Fade out del overlay
  overlay.style.transition = 'opacity .4s';
  overlay.style.opacity    = '0';
  setTimeout(() => { overlay.style.display = 'none'; }, 400);
  // Cargar el video con autoplay
  if (iframe && iframe.src === 'about:blank') {
    iframe.src = iframe.dataset.src;
  }
}

/* ── VSL ── */
function loadVsl(){
  const url=document.getElementById('vsl-url').value.trim();
  if(!url)return;

  if(url.includes('youtube.com/shorts')){
    alert('⚠️ Los YouTube Shorts no se pueden incrustar.\nSubí el video como video normal en YouTube.');
    return;
  }

  const em=toEmbed(url);
  if(!em){
    alert('URL no reconocida.\n\nFormatos soportados:\n• youtube.com/watch?v=XXXXX\n• vimeo.com/XXXXX\n• fast.wistia.com/medias/XXXXX\n• tudominio.wistia.com/medias/XXXXX');
    return;
  }

  // Ocultar overlay de play y embed de Wistia
  const playOverlay = document.getElementById('vsl-play-overlay');
  if(playOverlay) playOverlay.style.display='none';
  const wistiaWrap = document.getElementById('vsl-wistia-wrap');
  if(wistiaWrap) wistiaWrap.style.display='none';

  document.getElementById('vsl-ph').style.display='none';
  const w=document.getElementById('vsl-iframe');
  w.style.display='block';
  w.style.position='relative';
  w.innerHTML=`<iframe
    src="${em}"
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
    allowfullscreen
    allow="encrypted-media; picture-in-picture"
    loading="lazy"
  ></iframe>`;

  document.getElementById('vsl-hint').textContent='Video actualizado ✅';
}

/* ── HELPERS ── */
function toEmbed(u){
  u = u.trim().replace(/\s+/g,'');

  // YouTube watch
  let m = u.match(/youtube\.com\/watch.*[?&]v=([a-zA-Z0-9_-]{11})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;

  // YouTube youtu.be
  m = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;

  // YouTube embed directo
  m = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if(m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;

  // Vimeo
  m = u.match(/vimeo\.com\/(\d+)/);
  if(m) return `https://player.vimeo.com/video/${m[1]}`;

  // Wistia — cualquier formato: fast.wistia.com, home.wistia.com, dominio.wistia.com
  m = u.match(/wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/);
  if(m) return `https://fast.wistia.com/embed/iframe/${m[1]}?videoFoam=true&autoPlay=false`;

  // Wistia embed iframe directo
  m = u.match(/wistia\.com\/embed\/iframe\/([a-zA-Z0-9]+)/);
  if(m) return `https://fast.wistia.com/embed/iframe/${m[1]}?videoFoam=true&autoPlay=false`;

  // Ya es URL de embed
  if(u.includes('embed') || u.includes('player') || u.includes('iframe')) return u;

  return null;
}
function ytThumb(u){
  const m=u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?`https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`:null;
}

/* ── EDITOR TEXTOS ── */
function openTextEditor(){
  const get = id => { const el = document.getElementById(id); return el ? el.innerText.trim() : ''; };
  document.getElementById('te-badge').value = get('edit-badge');
  document.getElementById('te-l1').value = get('h1-l1');
  document.getElementById('te-l2').value = get('h1-l2');
  document.getElementById('te-l3').value = get('h1-l3');
  document.getElementById('te-sub').value = get('edit-sub');
  const teProof = document.getElementById('te-proof'); if(teProof) teProof.value = get('edit-proof');
  const teCtaBtn = document.getElementById('te-cta-btn'); if(teCtaBtn) teCtaBtn.value = get('edit-cta-text');
  const teCtaP = document.getElementById('te-cta-p'); if(teCtaP) teCtaP.value = get('edit-cta-p');
  try{ const c=localStorage.getItem('betovCalendly'); if(c){ const el=document.getElementById('te-calendly'); if(el) el.value=c; } }catch(e){}
  document.getElementById('textEditorPanel').classList.add('open');
}
function closeTextEditor(){document.getElementById('textEditorPanel').classList.remove('open')}

function applyTextChanges(){
  const g=(id)=>document.getElementById(id).value.trim();
  const s=(id,val)=>{if(val){const el=document.getElementById(id);if(el) el.textContent=val;}};
  if(g('te-badge')) document.getElementById('edit-badge').textContent=g('te-badge');
  s('h1-l1',g('te-l1')); s('h1-l2',g('te-l2')); s('h1-l3',g('te-l3'));
  if(g('te-sub'))  document.getElementById('edit-sub').textContent=g('te-sub');
  s('edit-proof',g('te-proof'));
  s('edit-cta-text',g('te-cta-btn'));
  if(g('te-cta-p')) document.getElementById('edit-cta-p').textContent=g('te-cta-p');
  // Guardar y aplicar Calendly
  if(g('te-calendly')) guardarCalendly(g('te-calendly'));
  closeTextEditor();
  showToast('✅ Cambios guardados');
  guardarTodo();
}

/* ── MODO EDICIÓN MEDIA ── */
/* ─── CALENDLY ─── */
function guardarCalendly(url) {
  if (!url) return;
  try { localStorage.setItem('betovCalendly', url); } catch(e) {}
  // Actualizar todos los botones que apuntan a Calendly
  document.querySelectorAll('[href*="calendly.com"]').forEach(el => {
    el.href = url;
  });
  showToast('✅ Link de Calendly guardado');
}
function restaurarCalendly() {
  try {
    const url = localStorage.getItem('betovCalendly');
    if (url) {
      document.querySelectorAll('[href*="calendly.com"]').forEach(el => {
        el.href = url;
      });
    }
  } catch(e) {}
}

/* ─── LOGO ─── */
function uploadLogo(input){
  const file=input.files[0];if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const src=e.target.result;
    const img=document.getElementById('nav-logo-img');
    const txt=document.getElementById('nav-logo-text');
    img.src=src; img.style.display='block'; txt.style.display='none';
    try{localStorage.setItem('betovLogo',src);}catch(err){}
    showToast('✅ Logo cargado');
  };
  reader.readAsDataURL(file);
}
function restaurarLogo(){
  try{
    const src=localStorage.getItem('betovLogo');
    if(src){
      const img=document.getElementById('nav-logo-img');
      const txt=document.getElementById('nav-logo-text');
      img.src=src; img.style.display='block'; txt.style.display='none';
    }
  }catch(e){}
}

let editMode=false;
function toggleEditMode(){
  editMode=!editMode;
  document.body.classList.toggle('edit-mode',editMode);
  const fab=document.getElementById('editFab');
  fab.textContent=editMode?'✅':'✏️';
  const logoBtn=document.getElementById('logo-upload-btn');
  if(logoBtn) logoBtn.style.display=editMode?'inline-flex':'none';
  if(editMode) showToast('Modo edición · Podés subir tu logo arriba izquierda');
}

/* ── EDITOR MEDIA ── */
let currentType=null,currentIdx=null,newImgSrc=null,newVThumbSrc=null;

function openEditor(type,idx){
  if(!editMode)return;
  currentType=type;currentIdx=idx;newImgSrc=null;newVThumbSrc=null;
  const data=type==='video'?vData[idx]:fData[idx];
  document.getElementById('editor-title').textContent=type==='video'?`Video ${idx+1}`:`Foto ${idx+1}`;
  document.getElementById('e-nombre').value=data.nombre;
  document.getElementById('e-result').value=data.result;
  document.getElementById('e-desc').value=data.desc;
  document.getElementById('media-foto-wrap').style.display=type==='foto'?'block':'none';
  document.getElementById('media-video-wrap').style.display=type==='video'?'block':'none';
  document.getElementById('tab-media').textContent=type==='video'?'🎬 Video':'🖼️ Imagen';
  if(type==='video'){
    document.getElementById('e-vurl').value=data.url||'';
    const th=document.getElementById(`vthumb-${idx}`);
    const prev=document.getElementById('e-vthumb-preview');
    if(th&&th.src){prev.src=th.src;prev.style.display='block';document.getElementById('vthumb-zone').classList.add('has-img')}
    else{prev.style.display='none';document.getElementById('vthumb-zone').classList.remove('has-img')}
  }else{
    const img=document.getElementById(`fimg-${idx}`);
    const prev=document.getElementById('e-foto-preview');
    if(img&&img.src){prev.src=img.src;prev.style.display='block';document.getElementById('img-zone').classList.add('has-img')}
    else{prev.style.display='none';document.getElementById('img-zone').classList.remove('has-img')}
  }
  switchTab('contenido');
  document.getElementById('editorPanel').classList.add('open');
}
function closeEditor(){document.getElementById('editorPanel').classList.remove('open');currentType=null;currentIdx=null}

function switchTab(tab){
  document.querySelectorAll('.ptab').forEach((t,i)=>t.classList.toggle('active',(i===0&&tab==='contenido')||(i===1&&tab==='media')));
  document.getElementById('pane-contenido').classList.toggle('active',tab==='contenido');
  document.getElementById('pane-media').classList.toggle('active',tab==='media');
}

function previewEditorImg(inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{newImgSrc=e.target.result;const p=document.getElementById('e-foto-preview');p.src=newImgSrc;p.style.display='block';document.getElementById('img-zone').classList.add('has-img')};
  r.readAsDataURL(f);
}
function previewEditorVThumb(inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{newVThumbSrc=e.target.result;const p=document.getElementById('e-vthumb-preview');p.src=newVThumbSrc;p.style.display='block';document.getElementById('vthumb-zone').classList.add('has-img')};
  r.readAsDataURL(f);
}

function saveEditor(){
  const nombre=document.getElementById('e-nombre').value.trim();
  const result=document.getElementById('e-result').value.trim();
  const desc=document.getElementById('e-desc').value.trim();
  if(currentType==='video'){
    const url=document.getElementById('e-vurl').value.trim();
    vData[currentIdx]={url,nombre,result,desc};
    document.getElementById(`vname-${currentIdx}`).textContent=nombre;
    document.getElementById(`vresult-${currentIdx}`).textContent=result;
    document.getElementById(`vdesc-${currentIdx}`).textContent=desc;
    const th=document.getElementById(`vthumb-${currentIdx}`);
    if(newVThumbSrc)th.src=newVThumbSrc;
    else if(url){const t=ytThumb(url);if(t)th.src=t;}
  }else{
    fData[currentIdx]={nombre,result,desc};
    document.getElementById(`fname-${currentIdx}`).textContent=nombre;
    document.getElementById(`fresult-${currentIdx}`).textContent=result;
    document.getElementById(`fdesc-${currentIdx}`).textContent=desc;
    if(newImgSrc)document.getElementById(`fimg-${currentIdx}`).src=newImgSrc;
  }
  closeEditor();
  showToast('✅ ¡Guardado!');
  guardarTodo();
}

/* ── CONTROL DE ALTURA DE FOTOS INLINE ── */
function setAlturaSlots(idx, val) {
  const h = parseInt(val);
  for (const tipo of ['antes','despues']) {
    const slot = document.getElementById(`vf-${idx}-${tipo}`);
    if (slot) slot.style.height = h + 'px';
  }
  const label = document.getElementById(`altura-val-${idx}`);
  if (label) label.textContent = h + 'px';
  guardarTodo();
}

function setPosicion(idx) {
  const xEl = document.getElementById(`pos-x-${idx}`);
  const yEl = document.getElementById(`pos-y-${idx}`);
  if (!xEl || !yEl) return;
  const x = parseInt(xEl.value);
  const y = parseInt(yEl.value);
  for (const tipo of ['antes','despues']) {
    const img = document.getElementById(`vfimg-${idx}-${tipo}`);
    if (img) { img.style.objectFit='cover'; img.style.objectPosition=`${x}% ${y}%`; }
  }
  const lx = document.getElementById(`pos-x-val-${idx}`);
  const ly = document.getElementById(`pos-y-val-${idx}`);
  if (lx) lx.textContent = x === 50 ? 'Centro' : (x < 50 ? 'Izq' : 'Der');
  if (ly) ly.textContent = y === 50 ? 'Centro' : (y < 50 ? 'Arriba' : 'Abajo');
  guardarTodo();
}

/* ── FOTO SLOTS + EDITOR DE RECORTE ── */
/* ── CONTROL DE ALTURA SECCIÓN TRANSFORMACIONES ── */
function setTransAltura(val) {
  const h = parseInt(val);
  // Aplicar a todos los fcaso-media
  document.querySelectorAll('.fcaso-media').forEach(el => {
    el.style.setProperty('--fcaso-h', h + 'px');
    el.style.height = h + 'px';
  });
  const label = document.getElementById('trans-altura-val');
  if (label) label.textContent = h + 'px';
  guardarTodo();
}

/* ── ALTURA VIDEOS ── */
function setVideoAltura(val) {
  const h = parseInt(val);
  document.querySelectorAll('.vcaso-media').forEach(el => {
    el.style.height = h + 'px';
  });
  const label = document.getElementById('video-altura-val');
  if (label) label.textContent = h + 'px';
  // Guardar
  try { localStorage.setItem('betovVideoAltura', h); } catch(e) {}
}
function restaurarVideoAltura() {
  try {
    const h = localStorage.getItem('betovVideoAltura');
    if (h) {
      const range = document.getElementById('video-altura-range');
      const label = document.getElementById('video-altura-val');
      if (range) range.value = h;
      if (label) label.textContent = h + 'px';
      document.querySelectorAll('.vcaso-media').forEach(el => {
        el.style.height = h + 'px';
      });
    }
  } catch(e) {}
}

/* ── CONTROL DE ALTURA DE FOTOS ── */
let currentSlotIdx = null, currentSlotType = null;
let cropState = { zoom: 100, x: 0, y: 0, dragging: false, startX: 0, startY: 0, imgSrc: '' };

function openFotoSlot(idx, tipo) {
  if (!editMode) return;
  currentSlotIdx = idx;
  currentSlotType = tipo;
  let inp = document.getElementById('_slot-file-input');
  if (!inp) {
    inp = document.createElement('input');
    inp.type = 'file';
    inp.id = '_slot-file-input';
    inp.accept = 'image/*';
    inp.style.display = 'none';
    document.body.appendChild(inp);
  }
  inp.onchange = function() {
    const f = this.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = e => {
      const src = e.target.result;
      const imgEl  = document.getElementById(`vfimg-${idx}-${tipo}`);
      const slotEl = document.getElementById(`vf-${idx}-${tipo}`);
      if (imgEl && slotEl) {
        imgEl.src = src;
        // Resetear estilos inline y usar CSS class
        imgEl.style.width  = '';
        imgEl.style.height = '';
        imgEl.style.objectFit = 'cover';
        imgEl.style.objectPosition = 'center center';
        slotEl.classList.add('has-img');
        // Si no tiene altura manual, usar la del slider o 360px por defecto
        const rangeEl = document.getElementById(`altura-range-${idx}`);
        const currentH = rangeEl ? rangeEl.value : 360;
        slotEl.style.height = currentH + 'px';
        cropState.imgSrc = src;
        showToast('✅ Foto cargada');
        guardarTodo();
      }
    };
    r.readAsDataURL(f);
    this.value = '';
  };
  inp.click();
}

function openCropEditor(src, idx, tipo) {
  currentSlotIdx = idx;
  currentSlotType = tipo;

  // Leer altura actual del slot
  const slot = document.getElementById(`vf-${idx}-${tipo}`);
  const currentH = slot ? parseInt(getComputedStyle(slot).height) || 260 : 260;
  const clampedH = Math.min(500, Math.max(140, currentH));

  cropState = { zoom: 100, x: 0, y: 0, dragging: false, startX: 0, startY: 0, imgSrc: src };

  // Setear el control de altura con el valor actual del slot
  document.getElementById('cropHeight').value = clampedH;
  document.getElementById('cropHeightVal').textContent = clampedH + 'px';

  // Ajustar el viewport de preview al mismo ratio
  const vp = document.getElementById('cropViewport');
  vp.style.aspectRatio = 'unset';
  vp.style.height = Math.min(clampedH, 320) + 'px';

  const img = document.getElementById('cropImg');
  img.src = src;
  img.onload = () => {
    updateCrop();
    document.getElementById('cropPanel').classList.add('open');
    initCropDrag();
  };
}

function updateCropHeight() {
  const h = parseInt(document.getElementById('cropHeight').value);
  document.getElementById('cropHeightVal').textContent = h + 'px';
  // Actualizar el viewport de preview proporcionalmente
  const vp = document.getElementById('cropViewport');
  vp.style.height = Math.min(h, 320) + 'px';
  vp.style.aspectRatio = 'unset';
}

function updateCrop() {
  const zoom = parseInt(document.getElementById('cropZoom').value);
  const x    = parseInt(document.getElementById('cropX').value);
  const y    = parseInt(document.getElementById('cropY').value);

  cropState.zoom = zoom;
  cropState.x    = x;
  cropState.y    = y;

  const img = document.getElementById('cropImg');
  const scale = zoom / 100;
  img.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
  img.style.left = '50%';
  img.style.top  = '50%';

  document.getElementById('cropZoomVal').textContent = zoom + '%';
  document.getElementById('cropYVal').textContent    = y === 0 ? 'Centro' : (y > 0 ? `+${y}px` : `${y}px`);
  document.getElementById('cropXVal').textContent    = x === 0 ? 'Centro' : (x > 0 ? `+${x}px` : `${x}px`);
}

function resetCrop() {
  document.getElementById('cropZoom').value  = 100;
  document.getElementById('cropX').value     = 0;
  document.getElementById('cropY').value     = 0;
  document.getElementById('cropHeight').value = 260;
  updateCropHeight();
  updateCrop();
}

/* Drag para mover la imagen */
function initCropDrag() {
  const vp = document.getElementById('cropViewport');
  // Limpiar listeners anteriores
  vp.replaceWith(vp.cloneNode(true));
  const newVp = document.getElementById('cropViewport');

  let isDragging = false, lastX = 0, lastY = 0;

  function onDown(e) {
    isDragging = true;
    const pt = e.touches ? e.touches[0] : e;
    lastX = pt.clientX;
    lastY = pt.clientY;
    newVp.style.cursor = 'grabbing';
  }
  function onMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - lastX;
    const dy = pt.clientY - lastY;
    lastX = pt.clientX;
    lastY = pt.clientY;

    const xInput = document.getElementById('cropX');
    const yInput = document.getElementById('cropY');
    xInput.value = Math.max(-100, Math.min(100, parseInt(xInput.value) + dx));
    yInput.value = Math.max(-100, Math.min(100, parseInt(yInput.value) + dy));
    updateCrop();
  }
  function onUp() {
    isDragging = false;
    newVp.style.cursor = 'grab';
  }

  newVp.addEventListener('mousedown', onDown);
  newVp.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);

  /* Pinch to zoom */
  let lastDist = 0;
  newVp.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (lastDist) {
        const delta = (dist - lastDist) * 0.5;
        const zInput = document.getElementById('cropZoom');
        zInput.value = Math.max(50, Math.min(300, parseInt(zInput.value) + delta));
        updateCrop();
      }
      lastDist = dist;
    }
  }, { passive: false });
  newVp.addEventListener('touchend', () => lastDist = 0);
}

/* Aplicar recorte: renderizar en canvas y guardar */
function applyCrop() {
  const img      = document.getElementById('cropImg');
  const imgId    = `vfimg-${currentSlotIdx}-${currentSlotType}`;
  const slotId   = `vf-${currentSlotIdx}-${currentSlotType}`;
  const target   = document.getElementById(imgId);
  const slot     = document.getElementById(slotId);

  // Simplemente usar la imagen original — sin recorte forzado
  // La imagen se muestra completa con width:100% height:auto
  target.src = cropState.imgSrc;
  target.style.objectFit = '';
  target.style.objectPosition = '';
  target.style.width  = '100%';
  target.style.height = 'auto';
  slot.classList.add('has-img');
  // Limpiar cualquier altura fija anterior para que la imagen defina el alto
  slot.style.height = '';
  slot.style.minHeight = '';

  // Aplicar también al slot pareja
  const pareja = currentSlotType === 'antes' ? 'despues' : 'antes';
  const slotPareja = document.getElementById(`vf-${currentSlotIdx}-${pareja}`);
  if (slotPareja && !slotPareja.classList.contains('has-img')) {
    slotPareja.style.height = '';
  }

  closeCrop();
  showToast('✅ Foto cargada — imagen completa');
  guardarTodo();
}

function closeCrop() {
  document.getElementById('cropPanel').classList.remove('open');
}

/* ── VIDEO CLICK ── */
function handleVcasoClick(el,idx){
  if(editMode){openEditor('video',idx);return}
  const url=vData[idx].url;
  if(url)openVM(url);
  else showToast('⚠️ Activá el modo ✏️ para agregar el video');
}

/* ── VIDEO MODAL ── */
function openVM(u){
  const em=toEmbed(u);if(!em)return;
  document.getElementById('vm-content').innerHTML=`<iframe
    src="${em}"
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
    allowfullscreen
    allow="autoplay; encrypted-media; picture-in-picture"
  ></iframe>`;
  document.getElementById('vmodal').classList.add('open');
}
function closeVM(){document.getElementById('vmodal').classList.remove('open');document.getElementById('vm-content').innerHTML=''}

/* ── FAQ ── */
function toggleFaq(btn){
  const item=btn.closest('.faq-item');
  const body=item.querySelector('.faq-body');
  const isOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el=>{
    el.classList.remove('open');
    el.querySelector('.faq-body').style.maxHeight='0';
  });
  if(!isOpen){
    item.classList.add('open');
    body.style.maxHeight=body.scrollHeight+'px';
  }
}

/* ── TOAST ── */
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.style.opacity='0',2800);
}

/* ── CONTROLES TRANSFORMACIONES ── */
function setFcasoAltura(idx, val) {
  const h = parseInt(val);
  const media = document.getElementById(`fmedia-${idx}`);
  if (media) {
    media.style.height = h + 'px';
    media.style.aspectRatio = 'unset'; // anula aspect-ratio si había uno
  }
  const lbl = document.getElementById(`fh-val-${idx}`);
  if (lbl) lbl.textContent = h + 'px';
  guardarTodo();
}

function setFcasoPos(idx) {
  const xEl = document.getElementById(`fx-${idx}`);
  const yEl = document.getElementById(`fy-${idx}`);
  if (!xEl || !yEl) return;
  const x = parseInt(xEl.value);
  const y = parseInt(yEl.value);
  const img = document.getElementById(`fimg-${idx}`);
  if (img) {
    img.style.objectFit = 'cover';
    img.style.objectPosition = `${x}% ${y}%`;
  }
  const lx = document.getElementById(`fx-val-${idx}`);
  const ly = document.getElementById(`fy-val-${idx}`);
  if (lx) lx.textContent = x === 50 ? 'Centro' : (x < 50 ? 'Izq' : 'Der');
  if (ly) ly.textContent = y === 50 ? 'Centro' : (y < 50 ? 'Arriba' : 'Abajo');
  guardarTodo();
}

/* ── PANEL GESTIÓN VIDEOS ── */
function openVideosPanel() {
  renderVideoManager();
  document.getElementById('videosPanel').classList.add('open');
}
function closeVideosPanel() {
  document.getElementById('videosPanel').classList.remove('open');
  guardarTodo();
}

function renderVideoManager() {
  const list = document.getElementById('video-manager-list');
  list.innerHTML = '';
  vData.forEach((v, i) => {
    const th = document.getElementById(`vthumb-${i}`);
    const thumbSrc = th ? th.src : '';
    const hasThumb = thumbSrc && !thumbSrc.includes('unsplash');

    list.innerHTML += `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
          <div style="width:56px;height:56px;border-radius:6px;overflow:hidden;background:#000;flex-shrink:0;border:1px solid var(--border2)">
            ${hasThumb ? `<img src="${thumbSrc}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#333;font-size:20px">▶</div>`}
          </div>
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;text-transform:uppercase;color:var(--white)">${v.nombre}</div>
            <div style="font-size:12px;color:var(--gold);margin-top:2px">${v.result}</div>
            <div style="font-size:11px;color:${v.url ? '#4ade80' : 'var(--gray2)'};margin-top:3px">
              ${v.url ? '✅ Video cargado' : '⚪ Sin video'}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:stretch">
          <input
            type="text"
            id="vmgr-url-${i}"
            value="${v.url || ''}"
            placeholder="Pegá el link del video de ${v.nombre}..."
            style="flex:1;background:#1A1A1A;border:1px solid var(--border2);border-radius:6px;color:var(--white);font-family:'Inter',sans-serif;font-size:13px;padding:10px 12px;outline:none"
            onfocus="this.style.borderColor='var(--gold)'"
            onblur="this.style.borderColor='var(--border2)'"
          >
          <button
            onclick="saveVideoUrl(${i})"
            style="background:var(--gold);color:var(--black);border:none;border-radius:6px;font-family:'Inter',sans-serif;font-weight:700;font-size:13px;padding:10px 16px;cursor:pointer;white-space:nowrap"
          >Guardar</button>
        </div>
      </div>
    `;
  });
}

function saveVideoUrl(idx) {
  const input = document.getElementById(`vmgr-url-${idx}`);
  const url = input.value.trim();

  if (url && url.includes('youtube.com/shorts')) {
    alert('⚠️ Los YouTube Shorts no se pueden incrustar. Usá un video normal de YouTube.');
    return;
  }

  vData[idx].url = url;

  // Actualizar thumbnail automáticamente si es YouTube
  if (url) {
    const th = document.getElementById(`vthumb-${idx}`);
    const ytId = ytThumb(url);
    // YouTube → thumbnail automático
    if (ytId && th) {
      th.src = ytId;
    }
    // Wistia → thumbnail de Wistia
    const wm = url.match(/wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/);
    if (wm && th) {
      th.src = `https://fast.wistia.com/embed/medias/${wm[1]}/swatch`;
    }
  }

  guardarTodo();
  renderVideoManager();
  showToast(`✅ Video de ${vData[idx].nombre} guardado`);
}

/* ── SCROLL REVEAL ── */
const ro=new IntersectionObserver(e=>e.forEach(x=>{
  if(x.isIntersecting){x.target.classList.add('in');ro.unobserve(x.target)}
}),{threshold:.01, rootMargin:'0px 0px -50px 0px'});
document.querySelectorAll('.reveal').forEach(el=>ro.observe(el));

// Fallback: activar todo lo que no se haya activado al cargar
setTimeout(()=>{
  document.querySelectorAll('.reveal:not(.in)').forEach(el=>el.classList.add('in'));
},1200);

/* ── NAV SCROLL ── */
window.addEventListener('scroll',()=>{
  document.querySelector('.nav').style.background=
    window.scrollY>10?'rgba(8,8,8,0.97)':'rgba(8,8,8,0.85)';
});

/* ── RESTAURAR AL CARGAR ── */
window.addEventListener('DOMContentLoaded', () => {
  restaurarTodo();
  restaurarLogo();
  restaurarCalendly();
  restaurarVideoAltura();
});
