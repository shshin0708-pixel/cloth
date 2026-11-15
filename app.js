/* Add one object here and one PNG in assets/costumes to extend the collection. */
const COSTUMES = [
  { id:'korea_boy_hanbok', country:'한국', flag:'🇰🇷', flagImage:'assets/flags/kr.png', costumeName:'남자한복', image:'assets/costumes/korea_boy_hanbok.png', faceX:.5, faceY:.204, faceSize:.172, faceHeight:.183, faceShape:'ellipse', alignX:0, alignY:0, enabled:true },
  { id:'korea_girl_hanbok', country:'한국', flag:'🇰🇷', flagImage:'assets/flags/kr.png', costumeName:'여자한복', image:'assets/costumes/korea_girl_hanbok.png', faceX:.5, faceY:.205, faceSize:.176, faceHeight:.184, faceShape:'ellipse', alignX:0, alignY:0, enabled:true },
  { id:'japan_kimono', country:'일본', flag:'🇯🇵', flagImage:'assets/flags/jp.png', costumeName:'기모노', image:'assets/costumes/japan_kimono.png', faceX:.495, faceY:.225, faceSize:.17, faceHeight:.158, faceShape:'ellipse', alignX:0, alignY:0, enabled:true },
  { id:'india_sari', country:'인도', flag:'🇮🇳', flagImage:'assets/flags/in.png', costumeName:'사리', image:'assets/costumes/india_sari.png', faceX:.5, faceY:.18, faceSize:.171, faceHeight:.195, faceShape:'ellipse', alignX:0, alignY:0, enabled:true },
  { id:'vietnam_ao_dai', country:'베트남', flag:'🇻🇳', flagImage:'assets/flags/vn.png', costumeName:'아오자이', image:'assets/costumes/vietnam_ao_dai.png', faceX:.5, faceY:.184, faceSize:.148, faceHeight:.193, faceShape:'ellipse', alignX:0, alignY:0, enabled:true },
  { id:'scotland_kilt', country:'스코틀랜드', flag:'🏴', flagImage:'assets/flags/gb-sct.png', costumeName:'킬트', image:'assets/costumes/scotland_kilt.png', faceX:.494, faceY:.21, faceSize:.155, faceHeight:.167, faceShape:'ellipse', faceMaskMode:'scanline', faceBounds:{left:.415,top:.115,right:.575,bottom:.295}, alignX:0, alignY:0, enabled:true },
  { id:'mexico_sombrero', country:'멕시코', flag:'🇲🇽', flagImage:'assets/flags/mx.png', costumeName:'솜브레로 의상', image:'assets/costumes/mexico_sombrero.png', faceX:.5, faceY:.273, faceSize:.151, faceHeight:.166, faceShape:'ellipse', alignX:0, alignY:0, enabled:true },
  { id:'china_tang_suit', country:'중국', flag:'🇨🇳', flagImage:'assets/flags/cn.png', costumeName:'전통의상', image:'assets/costumes/china_tang_suit.png', faceX:.5, faceY:.225, faceSize:.156, faceHeight:.173, faceShape:'ellipse', alignX:0, alignY:0, enabled:true }
];

const $ = (id) => document.getElementById(id);
const screens = ['start','select','camera','edit','finish'];
const freshAdjustment = () => ({x:0,y:0,scale:1.15});
const state = { selected:null, stream:null, photo:null, adjustment:freshAdjustment(), page:0, cameraRequest:0 };
const imageCache = new Map();
const faceMaskCache = new Map();
let drag = null;

function enabledCostumes(){ return COSTUMES.filter(item => item.enabled); }
function showScreen(name){
  for(const screen of screens) $(`${screen}Screen`).classList.toggle('active', screen === name);
  $('stepLabel').textContent = ({start:'',select:'옷 고르기',camera:'얼굴 찍기',edit:'얼굴 맞추기',finish:'완성'})[name];
  if(name !== 'camera') stopCamera();
  if(name === 'select') renderCards();
  window.scrollTo(0,0);
}
function setCostumeLabels(){
  for(const id of ['cameraCostume','editCostume','finishCostume']){
    const box=$(id); box.replaceChildren();
    const flag=document.createElement('img'); flag.src=state.selected.flagImage; flag.alt=''; flag.className='inline-flag';
    box.append(flag,document.createTextNode(`${state.selected.country} · ${state.selected.costumeName}`));
  }
}
function pageSize(){ return window.matchMedia('(max-width: 650px)').matches ? 4 : 8; }
function renderCards(){
  const all = enabledCostumes(), size = pageSize(), count = Math.max(1, Math.ceil(all.length/size));
  state.page = Math.min(state.page, count-1);
  const shown = all.slice(state.page*size,(state.page+1)*size);
  const grid = $('costumeGrid'); grid.replaceChildren();
  for(const item of shown){
    const card = document.createElement('button'); card.type='button'; card.className='costume-card'; card.dataset.id=item.id;
    card.setAttribute('aria-label', `${item.country} ${item.costumeName} 선택`);
    const image = document.createElement('span'); image.className='card-image';
    const img = document.createElement('img'); img.src=item.image; img.alt=''; img.loading='lazy'; image.append(img);
    const title = document.createElement('span'); title.className='card-title';
    const flag=document.createElement('img');flag.src=item.flagImage;flag.alt='';flag.className='inline-flag';
    title.append(flag,document.createTextNode(item.country));
    const subtitle = document.createElement('span'); subtitle.className='card-subtitle'; subtitle.textContent=item.costumeName;
    card.append(image,title,subtitle); card.addEventListener('click',()=>chooseCostume(item)); grid.append(card);
  }
  $('pageLabel').textContent = count > 1 ? `${state.page+1} / ${count}` : '';
  $('prevPage').disabled = state.page === 0;
  $('nextPage').disabled = state.page === count-1;
  document.querySelector('.page-controls').hidden = count === 1;
}
async function loadCostume(item){
  if(imageCache.has(item.id)) return imageCache.get(item.id);
  const image = new Image(); image.src=item.image;
  const promise = image.decode().then(()=>image).catch(()=>{ imageCache.delete(item.id); throw new Error('의상 그림을 불러오지 못했어요.'); });
  imageCache.set(item.id,promise); return promise;
}
async function chooseCostume(item){
  state.selected=item; state.adjustment=freshAdjustment(); setCostumeLabels();
  try { await loadCostume(item); } catch(error){ alert(error.message); return; }
  if(state.photo){ showScreen('edit'); await renderPreview(); }
  else { showScreen('camera'); await startCamera(); }
}
function stopCamera(){
  state.cameraRequest++;
  if(state.stream){ state.stream.getTracks().forEach(track=>track.stop()); state.stream=null; }
  $('cameraVideo').srcObject=null;
  $('captureButton').disabled=true;
}
function cameraError(error){
  if(location.protocol==='file:') return '파일을 직접 열면 사진 합성이 막힐 수 있어요. start-photobooth.cmd를 실행하거나 HTTPS 주소로 접속해 주세요.';
  if(!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) return '카메라는 HTTPS 주소 또는 localhost에서 열어 주세요.';
  if(error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') return '카메라 사용을 허용해 주세요. 브라우저의 카메라 권한을 확인해 주세요.';
  if(error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') return '이 기기에서 카메라를 찾지 못했어요.';
  if(error?.name === 'NotReadableError' || error?.name === 'TrackStartError') return '다른 앱에서 카메라를 쓰고 있을 수 있어요. 다른 앱을 닫고 다시 눌러 주세요.';
  return '카메라를 켜지 못했어요. 다시 눌러 주세요.';
}
async function startCamera(){
  stopCamera();
  const request=state.cameraRequest;
  $('cameraMessage').textContent='카메라 권한 창이 보이면 허용해 주세요.'; $('retryCameraButton').hidden=true;
  if(location.protocol==='file:'){ $('cameraMessage').textContent=cameraError(); return; }
  if(!navigator.mediaDevices?.getUserMedia || !window.isSecureContext){ $('cameraMessage').textContent=cameraError(); $('retryCameraButton').hidden=false; return; }
  try{
    let stream;
    try { stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'user'},width:{ideal:1280},height:{ideal:960}}}); }
    catch(error){ if(error.name==='OverconstrainedError') stream=await navigator.mediaDevices.getUserMedia({audio:false,video:true}); else throw error; }
    if(request!==state.cameraRequest){stream.getTracks().forEach(track=>track.stop());return;}
    state.stream=stream; $('cameraVideo').srcObject=stream;
    await $('cameraVideo').play();
    if(request!==state.cameraRequest) return;
    $('cameraMessage').textContent=''; $('captureButton').disabled=false;
  }catch(error){ if(request!==state.cameraRequest)return; $('cameraMessage').textContent=cameraError(error); $('retryCameraButton').hidden=false; }
}
function capturePhoto(){
  const video=$('cameraVideo'), frame=document.querySelector('.camera-frame'), guide=document.querySelector('.face-guide');
  if(!state.stream || !video.videoWidth || !video.videoHeight){ $('cameraMessage').textContent='카메라 화면이 나타난 뒤 다시 찍어 주세요.'; return; }
  const w=frame.clientWidth,h=frame.clientHeight, pixelRatio=2;
  const frameCanvas=document.createElement('canvas'); frameCanvas.width=Math.round(w*pixelRatio); frameCanvas.height=Math.round(h*pixelRatio);
  const ctx=frameCanvas.getContext('2d');
  const scale=Math.max(frameCanvas.width/video.videoWidth,frameCanvas.height/video.videoHeight);
  const drawnW=video.videoWidth*scale,drawnH=video.videoHeight*scale;
  ctx.save(); ctx.translate(frameCanvas.width,0); ctx.scale(-1,1);
  ctx.drawImage(video,(frameCanvas.width-drawnW)/2,(frameCanvas.height-drawnH)/2,drawnW,drawnH); ctx.restore();
  const g=guide.getBoundingClientRect(), f=frame.getBoundingClientRect();
  const sourceX=(g.left-f.left-frame.clientLeft)*pixelRatio,sourceY=(g.top-f.top-frame.clientTop)*pixelRatio;
  const sourceW=g.width*pixelRatio,sourceH=g.height*pixelRatio;
  const photo=document.createElement('canvas'); photo.width=512; photo.height=Math.round(512*sourceH/sourceW);
  photo.getContext('2d').drawImage(frameCanvas,sourceX,sourceY,sourceW,sourceH,0,0,photo.width,photo.height);
  state.photo=photo; frameCanvas.width=0; frameCanvas.height=0;
  state.adjustment=freshAdjustment(); showScreen('edit'); renderPreview();
}
function getFaceMask(costume,image,w,h){
  const key=`${costume.id}:${w}x${h}`;
  if(faceMaskCache.has(key)) return faceMaskCache.get(key);
  const cx=(costume.faceX+costume.alignX)*w, cy=(costume.faceY+costume.alignY)*h;
  const faceW=costume.faceSize*w;
  const faceH=(costume.faceShape==='circle' ? costume.faceSize*w : costume.faceHeight*h);
  const rx=faceW*.76, ry=faceH*.76;
  const x0=Math.max(0,Math.floor(cx-rx)), y0=Math.max(0,Math.floor(cy-ry));
  const rw=Math.min(w-x0,Math.ceil(rx*2)), rh=Math.min(h-y0,Math.ceil(ry*2));
  const sample=document.createElement('canvas');sample.width=rw;sample.height=rh;
  const sampleCtx=sample.getContext('2d',{willReadFrequently:true});
  sampleCtx.drawImage(image,-x0,-y0,w,h);
  const pixels=sampleCtx.getImageData(0,0,rw,rh).data;
  if(costume.faceMaskMode==='scanline'){
    const {left,top,right,bottom}=costume.faceBounds;
    const minRow=Math.max(0,Math.ceil(top*h-y0)), maxRow=Math.min(rh-1,Math.floor(bottom*h-y0));
    const minCol=Math.max(0,Math.ceil(left*w-x0)), maxCol=Math.min(rw-1,Math.floor(right*w-x0));
    const centerX=cx-x0, centerY=cy-y0, matte=new Uint8Array(rw*rh);
    const runs=new Array(rh);
    for(let y=minRow;y<=maxRow;y++){
      let bestStart=-1,bestEnd=-1,bestDistance=Infinity;
      for(let x=minCol;x<=maxCol;){
        if(pixels[(y*rw+x)*4+3]>=64){x++;continue;}
        const start=x;
        while(x<=maxCol&&pixels[(y*rw+x)*4+3]<64)x++;
        const end=x-1;
        const distance=centerX<start?start-centerX:centerX>end?centerX-end:0;
        if(end-start>=4&&distance<bestDistance){bestStart=start;bestEnd=end;bestDistance=distance;}
      }
      if(bestStart<0||bestDistance>faceW*.2)continue;
      const dy=Math.max(0,(y-centerY)/(faceH/2));
      const expectedWidth=faceW*Math.sqrt(Math.max(0,1-dy*dy));
      runs[y]={start:bestStart,end:bestEnd,valid:bestEnd-bestStart+1<=expectedWidth*1.08+3};
    }
    let minX=rw,maxX=0,minY=rh,maxY=0;
    for(let y=minRow;y<=maxRow;y++){
      if(y+y0<=h*.15){
        for(let x=minCol;x<=maxCol;x++){
          if(pixels[(y*rw+x)*4+3]>=64)continue;
          matte[y*rw+x]=1;
          minX=Math.min(minX,x);maxX=Math.max(maxX,x);
          minY=Math.min(minY,y);maxY=Math.max(maxY,y);
        }
        continue;
      }
      const run=runs[y];
      if(!run)continue;
      let start=run.start,end=run.end;
      if(!run.valid){
        let before=y-1,after=y+1;
        while(before>=minRow&&!runs[before]?.valid)before--;
        while(after<=maxRow&&!runs[after]?.valid)after++;
        if(before<minRow||after>maxRow)continue;
        const t=(y-before)/(after-before);
        start=Math.round(runs[before].start*(1-t)+runs[after].start*t);
        end=Math.round(runs[before].end*(1-t)+runs[after].end*t);
      }
      minX=Math.min(minX,start);maxX=Math.max(maxX,end);
      minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(let x=start;x<=end;x++)matte[y*rw+x]=1;
    }
    const mask=document.createElement('canvas');mask.width=rw;mask.height=rh;
    const maskCtx=mask.getContext('2d');
    const maskPixels=maskCtx.createImageData(rw,rh);
    for(let i=0;i<matte.length;i++){
      if(!matte[i])continue;
      const x=i%rw,y=(i/rw)|0;
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
        const nx=x+ox,ny=y+oy;
        if(nx<0||ny<0||nx>=rw||ny>=rh||ox*ox+oy*oy>4)continue;
        const n=ny*rw+nx;
        if(pixels[n*4+3]<250)maskPixels.data[n*4+3]=255;
      }
    }
    maskCtx.putImageData(maskPixels,0,0);
    const result={mask,x0,y0,rw,rh,centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,width:maxX-minX+1,height:maxY-minY+1};
    faceMaskCache.set(key,result);
    return result;
  }
  const visited=new Uint8Array(rw*rh), queue=new Int32Array(rw*rh);
  const seedX=Math.round(cx-x0), seedY=Math.round(cy-y0);
  const alphaAt=(x,y)=>pixels[(y*rw+x)*4+3];
  let front=0,back=0,minX=rw,maxX=0,minY=rh,maxY=0;
  const eligible=(x,y)=>{
    if(x<0||y<0||x>=rw||y>=rh)return false;
    const dx=(x+x0-cx)/rx,dy=(y+y0-cy)/ry;
    return dx*dx+dy*dy<=1 && alphaAt(x,y)<64;
  };
  if(eligible(seedX,seedY)){
    const seed=seedY*rw+seedX;visited[seed]=1;queue[back++]=seed;
    while(front<back){
      const index=queue[front++],x=index%rw,y=(index/rw)|0;
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
        const next=ny*rw+nx;
        if(!visited[next]&&eligible(nx,ny)){visited[next]=1;queue[back++]=next;}
      }
    }
  }
  const mask=document.createElement('canvas');mask.width=rw;mask.height=rh;
  const maskCtx=mask.getContext('2d');
  if(back<1000){
    maskCtx.fillStyle='white';maskCtx.beginPath();maskCtx.ellipse(cx-x0,cy-y0,faceW/2,faceH/2,0,0,2*Math.PI);maskCtx.fill();
    minX=Math.round(cx-x0-faceW/2);maxX=Math.round(cx-x0+faceW/2);
    minY=Math.round(cy-y0-faceH/2);maxY=Math.round(cy-y0+faceH/2);
  }else{
    const matte=maskCtx.createImageData(rw,rh);
    for(let i=0;i<visited.length;i++){
      if(!visited[i])continue;
      const x=i%rw,y=(i/rw)|0;
      for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
        const nx=x+ox,ny=y+oy;
        if(nx<0||ny<0||nx>=rw||ny>=rh||ox*ox+oy*oy>4)continue;
        const n=ny*rw+nx;
        if(pixels[n*4+3]<250)matte.data[n*4+3]=255;
      }
    }
    maskCtx.putImageData(matte,0,0);
  }
  const result={mask,x0,y0,rw,rh,centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,width:maxX-minX+1,height:maxY-minY+1};
  faceMaskCache.set(key,result);
  return result;
}
function drawComposite(canvas,image){
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  if(!state.photo||!state.selected||!image)return;
  const face=getFaceMask(state.selected,image,w,h),adjust=state.adjustment;
  const cover=Math.max(face.width/state.photo.width,face.height/state.photo.height)*adjust.scale;
  const photoW=state.photo.width*cover,photoH=state.photo.height*cover;
  const shiftX=Math.max(-(photoW-face.width)/2,Math.min((photoW-face.width)/2,adjust.x*face.width));
  const shiftY=Math.max(-(photoH-face.height)/2,Math.min((photoH-face.height)/2,adjust.y*face.height));
  const layer=document.createElement('canvas');layer.width=face.rw;layer.height=face.rh;
  const layerCtx=layer.getContext('2d');
  layerCtx.drawImage(state.photo,face.centerX-photoW/2+shiftX,face.centerY-photoH/2+shiftY,photoW,photoH);
  layerCtx.globalCompositeOperation='destination-in';layerCtx.drawImage(face.mask,0,0);
  ctx.drawImage(layer,face.x0,face.y0);
  ctx.drawImage(image,0,0,w,h);
}
async function renderPreview(){
  if(!state.selected || !state.photo)return false;
  const selected=state.selected;
  try{
    const image=await loadCostume(selected);
    if(state.selected!==selected)return false;
    drawComposite($('previewCanvas'),image);
    drawComposite($('resultCanvas'),image);
    $('editMessage').hidden=true;
    return true;
  }catch(error){
    console.error('사진 합성 실패',error);
    $('editMessage').textContent=location.protocol==='file:'
      ? '파일을 직접 열면 사진 합성이 막힐 수 있어요. start-photobooth.cmd로 실행해 주세요.'
      : '사진을 합치지 못했어요. 페이지를 새로고침하고 다시 찍어 주세요.';
    $('editMessage').hidden=false;
    return false;
  }
}
function adjustFace(action){
  const a=state.adjustment, step=.05;
  if(action==='up')a.y-=step; if(action==='down')a.y+=step;
  if(action==='left')a.x-=step; if(action==='right')a.x+=step;
  if(action==='larger')a.scale=Math.min(2,a.scale+.08);
  if(action==='smaller')a.scale=Math.max(1,a.scale-.08);
  a.x=Math.max(-.2,Math.min(.2,a.x)); a.y=Math.max(-.2,Math.min(.2,a.y));
  renderPreview();
}
async function saveImage(){
  const canvas=$('resultCanvas');
  if(!state.photo)return;
  const fileName=`지구촌전통의상_${state.selected.country}_${state.selected.costumeName}.png`;
  let blob;
  try{blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));}
  catch(error){console.error('사진 저장 실패',error);alert('사진을 저장하지 못했어요. HTTPS 주소나 localhost에서 다시 열어 주세요.');return;}
  if(!blob){alert('사진을 저장하지 못했어요. 다시 눌러 주세요.');return;}
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=fileName;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function nextFriend(){
  stopCamera(); state.photo=null; state.selected=null; state.adjustment=freshAdjustment(); state.page=0;
  for(const id of ['previewCanvas','resultCanvas']){const c=$(id);c.getContext('2d').clearRect(0,0,c.width,c.height);}
  $('cameraMessage').textContent='';showScreen('select');
}

$('startButton').addEventListener('click',()=>showScreen('select'));
$('selectHome').addEventListener('click',()=>showScreen('start'));
$('prevPage').addEventListener('click',()=>{state.page--;renderCards();});
$('nextPage').addEventListener('click',()=>{state.page++;renderCards();});
$('cameraBack').addEventListener('click',()=>showScreen('select'));
$('captureButton').addEventListener('click',capturePhoto);
$('retryCameraButton').addEventListener('click',startCamera);
$('retakeButton').addEventListener('click',async()=>{state.photo=null;showScreen('camera');await startCamera();});
document.querySelectorAll('[data-adjust]').forEach(button=>button.addEventListener('click',()=>adjustFace(button.dataset.adjust)));
$('finishButton').addEventListener('click',async()=>{if(await renderPreview())showScreen('finish');});
$('saveButton').addEventListener('click',saveImage);
$('changeCostumeButton').addEventListener('click',()=>showScreen('select'));
$('nextFriendButton').addEventListener('click',nextFriend);
$('previewCanvas').addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,ax:state.adjustment.x,ay:state.adjustment.y};event.currentTarget.setPointerCapture(event.pointerId);});
$('previewCanvas').addEventListener('pointermove',event=>{if(!drag)return;const bounds=event.currentTarget.getBoundingClientRect();const costume=state.selected;state.adjustment.x=Math.max(-.2,Math.min(.2,drag.ax+(event.clientX-drag.x)/(bounds.width*costume.faceSize)));state.adjustment.y=Math.max(-.2,Math.min(.2,drag.ay+(event.clientY-drag.y)/(bounds.height*costume.faceHeight)));renderPreview();});
for(const name of ['pointerup','pointercancel'])$('previewCanvas').addEventListener(name,()=>{drag=null;});
window.addEventListener('resize',()=>{if($('selectScreen').classList.contains('active'))renderCards();});
window.addEventListener('pagehide',stopCamera);
showScreen('start');
