export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const clone=x=>JSON.parse(JSON.stringify(x));
export const chars=s=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(s)].map(x=>x.segment):Array.from(s);
export function layoutFor(w,h,bg='black',size=56){
 if(!(w>0&&h>0))throw Error('영상 크기를 확인하세요.');
 const portrait=h>w,r=w/h;let iw,ih;
 if(r>=1080/1920){iw=1080;ih=Math.max(2,Math.floor(1080/r/2)*2);}else{ih=1920;iw=Math.max(2,Math.floor(1920*r/2)*2);}
 const x=Math.floor((1080-iw)/4)*2,y=Math.floor((1920-ih)/4)*2,inner=portrait?Math.max(20,iw-2*Math.min(70,iw*.08)):940;
 const titleBox=portrait?{x:540,y:Math.max(y+65,150)+Math.min(340,ih*.28)/2,width:inner,height:Math.min(340,ih*.28)}:{x:540,y:y/2,width:940,height:Math.max(40,y-80)};
 return{portrait,bg:bg==='white'?'white':'black',iw,ih,x,y,inner,size:Math.min(size,Math.max(18,Math.floor(inner/10))),sy:portrait?Math.min(y+ih-70,1680):Math.round((y+ih+36+1700)/2),titleBox};
}
export function fitFilter(L){return "[0:v:0]scale=w='max(2,trunc(iw*if(gt(sar,0),sar,1)/2)*2)':h=ih,setsar=1,scale=w=1080:h=1920:force_original_aspect_ratio=decrease:force_divisible_by=2,"+`pad=w=1080:h=1920:x=trunc((ow-iw)/4)*2:y=trunc((oh-ih)/4)*2:color=${L.bg},setsar=1`;}
export function wrapMeasured(text,width,measure){
 const out=[];
 for(const p of String(text).replace(/\r\n?/g,'\n').split('\n')){
  let line='';if(!p){out.push('');continue;}
  for(const ch of chars(p)){
   if(line&&measure(line+ch)>width){const i=line.lastIndexOf(' ');if(i>0&&measure(line.slice(0,i))>width*.45){out.push(line.slice(0,i).trimEnd());line=line.slice(i+1)+ch;}else{out.push(line.trimEnd());line=ch.trimStart();}}else line+=ch;
  }out.push(line.trimEnd());
 }return out;
}
export function fitTitle(text,box,metric){
 const clean=String(text).replace(/\u0000/g,'').trim();if(!clean)return{size:0,lines:[],height:0};
 let lo=18,hi=720,best=null;
 while(lo<=hi){const size=(lo+hi)>>1,m=metric(size),lines=wrapMeasured(clean,box.width,m.measure),height=lines.length*m.lineHeight;if(lines.length<=3&&height<=box.height&&lines.every(t=>m.measure(t)<=box.width+.1)){best={size,lines,height};lo=size+1;}else hi=size-1;}
 if(!best)throw Error('제목이 3줄에 들어가지 않습니다. 제목을 줄여주세요.');return best;
}
export function cueErrors(cues,duration){
 const errors=new Map();for(const c of cues){if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end-c.start<.04||c.end>duration+.001)errors.set(c.id,'시간은 클립 범위 안에서 길이 0.04초 이상이어야 합니다.');else if(!c.text.trim())errors.set(c.id,'문구를 입력하세요.');else if(chars(c.text).length>300)errors.set(c.id,'문구는 300자 이내입니다.');}
 let prev=null;for(const c of [...cues].sort((a,b)=>a.start-b.start)){if(prev&&c.start<prev.end-.001){errors.set(c.id,'다른 자막과 시간이 겹칩니다.');errors.set(prev.id,'다른 자막과 시간이 겹칩니다.');}if(!prev||c.end>prev.end)prev=c;}return errors;
}
export function stamp(s){let ms=Math.max(0,Math.round(s*1000));const h=Math.floor(ms/3600000);ms%=3600000;const m=Math.floor(ms/60000);ms%=60000;const sec=Math.floor(ms/1000);ms%=1000;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`;}
export function parseStamp(s){const m=s.trim().match(/^(\d{1,3}):(\d{2}):(\d{2})[,.](\d{3})$/);if(!m||+m[2]>59||+m[3]>59)throw Error('SRT 시간 형식 오류');return +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000;}
export function toSrt(cues){return [...cues].sort((a,b)=>a.start-b.start).map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text.trim()}\n`).join('\n');}
export function fromSrt(s){
 const clean=String(s).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();if(!clean)return[];
 const cues=clean.split(/\n[ \t]*\n/).map(block=>{const lines=block.split('\n');if(/^\d+$/.test(lines[0].trim()))lines.shift();const m=(lines.shift()||'').match(/^\s*(\d{1,3}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,3}:\d{2}:\d{2}[,.]\d{3})(?:\s+.*)?$/);if(!m)throw Error('SRT 시간 줄이 올바르지 않습니다.');const start=parseStamp(m[1]),end=parseStamp(m[2]),text=lines.join('\n').replace(/<[^>]*>/g,'').replace(/\u0000/g,'').trim();if(!text||end<=start)throw Error('SRT 문장/시간을 확인하세요.');return{start,end,text};});
 if(cues.length>300)throw Error('최대 300개 자막까지 지원합니다.');return cues;
}
export function assTime(s){let c=Math.max(0,Math.round(s*100));const h=Math.floor(c/360000);c%=360000;const m=Math.floor(c/6000);c%=6000;const sec=Math.floor(c/100);c%=100;return`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(c).padStart(2,'0')}`;}
export const safeAss=s=>String(s).replace(/\\/g,'＼').replace(/{/g,'｛').replace(/}/g,'｝').replace(/\r/g,'').replace(/\n/g,'\\N').replace(/[\x00-\x1f]/g,' ');
export function assColor(hex,opacity=1){if(!/^#[0-9a-f]{6}$/i.test(hex))hex='#ffffff';const h=hex.slice(1);return '&H'+Math.round((1-clamp(opacity,0,1))*255).toString(16).padStart(2,'0')+h.slice(4,6)+h.slice(2,4)+h.slice(0,2);}
export function makeAss(cues,title,duration,L,style){
 const color=L.portrait?style.color:(L.bg==='white'?'#000000':'#ffffff'),outline=L.portrait?style.outline:0,border=L.portrait&&style.box>0?3:1,align=L.portrait?2:5;
 const back=assColor('#000000',style.box),edge=border===3?back:assColor('#000000',1),primary=assColor(color),bold=style.bold?-1:0;
 const header=`[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Noto Sans CJK KR,${L.size},${primary},${primary},${edge},${back},${bold},0,0,0,100,100,0,0,${border},${border===3?12:outline},0,${align},20,20,20,1
Style: Title,Noto Sans CJK KR,${Math.max(18,title.size)},${primary},${primary},${edge},${back},0,0,0,0,100,100,0,0,${border},${border===3?12:outline},0,5,20,20,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
 const ev=cues.map(c=>`Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,{\\an${align}\\pos(540,${Math.round(L.sy)})\\fs${Math.round(c.fontSize||L.size)}}${safeAss(c.display||c.text)}`);
 if(title.lines.length)ev.push(`Dialogue: 1,0:00:00.00,${assTime(duration)},Title,,0,0,0,,{\\an5\\pos(540,${Math.round(L.titleBox.y)})}${safeAss(title.lines.join('\n'))}`);
 return header+ev.join('\n')+'\n';
}
export function shiftCues(cues,delta,duration){const next=cues.map(c=>({...c,start:Math.round((c.start+delta)*100)/100,end:Math.round((c.end+delta)*100)/100}));if(next.some(c=>c.start<0||c.end>duration+.001))throw Error('이동하면 클립 범위를 벗어납니다.');return next;}
export function snapTime(time,step){return step>0?Math.round(time/step)*step:time;}
export function validateProject(p){
 if(!p||p.format!=='shortflix-manual-v2'||!Array.isArray(p.cues)||p.cues.length>300)throw Error('호환되는 SHORTFLIX 프로젝트가 아닙니다.');
 const base={title:'',background:'black',clipStart:0,duration:30,size:56,color:'#ffffff',outline:3,box:.55,bold:false};
 const s={...base,...p.settings};s.title=String(s.title).slice(0,200);s.background=s.background==='white'?'white':'black';
 for(const[k,min,max]of[['clipStart',0,1800],['duration',.1,30],['size',24,100],['outline',0,8],['box',0,1]]){if(typeof s[k]!=='number')throw Error('프로젝트 설정 숫자 형식 오류');if(!Number.isFinite(s[k])||s[k]<min||s[k]>max)throw Error('프로젝트 설정 범위 오류: '+k);}
 s.color=/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#ffffff';s.bold=!!s.bold;
 const cues=p.cues.map((c,i)=>{const start=c.start,end=c.end,text=String(c.text??'');if(typeof start!=='number'||typeof end!=='number'||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<start||end>1800||chars(text).length>300)throw Error('프로젝트 자막 형식 오류');return{id:i+1,start,end,text};});
 return{format:'shortflix-manual-v2',settings:s,cues,source:p.source&&typeof p.source.name==='string'?{name:p.source.name.slice(0,300),size:Number(p.source.size)||0}:null};
}

export function fitCaption(text,L,metric){
 const maxHeight=L.portrait?Math.min(380,L.ih*.3):2*Math.min(L.sy-(L.y+L.ih+24),1700-L.sy);
 let lo=18,hi=Math.floor(L.size),best=null;
 while(lo<=hi){const size=(lo+hi)>>1,m=metric(size),lines=wrapMeasured(text,L.inner,m.measure),height=lines.length*m.lineHeight;
  if(lines.length<=3&&height<=maxHeight&&lines.every(t=>m.measure(t)<=L.inner+.1)){best={display:lines.join('\n'),fontSize:size};lo=size+1;}else hi=size-1;
 }
 if(!best)throw Error('자막 영역을 넘습니다. 문구를 줄이거나 여러 자막으로 나누세요.');return best;
}
