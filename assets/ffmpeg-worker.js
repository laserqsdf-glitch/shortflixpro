/* Classic same-origin worker. Uses the published FFmpeg core, no npm wrapper.
   Protocol mirrors FFmpeg's documented worker implementation. */
let core;
self.onmessage=async({data:{id,op,data}})=>{
 try{
  let value=true;
  if(op==='load'){
   importScripts(data.coreURL);
   core=await self.createFFmpegCore({mainScriptUrlOrBlob:data.coreURL+'#'+btoa(JSON.stringify({wasmURL:data.wasmURL,workerURL:data.workerURL}))});
   core.setLogger(x=>self.postMessage({event:'log',data:x.message}));
   core.setProgress(x=>self.postMessage({event:'progress',data:x.progress}));
  }else{
   if(!core)throw Error('FFmpeg is not loaded');
   switch(op){
    case 'exec':core.setTimeout(data.timeout||-1);core.exec(...data.args);value=core.ret;core.reset();break;
    case 'mount':{
     const fs=core.FS.filesystems.WORKERFS;if(!fs)throw Error('WORKERFS unavailable');
     core.FS.mkdir('/input');core.FS.mount(fs,{files:[data.file]},'/input');break;
    }
    case 'mkdir':core.FS.mkdir(data.path);break;
    case 'write':core.FS.writeFile(data.path,data.bytes);break;
    case 'read':value=core.FS.readFile(data.path);break;
    case 'unlink':core.FS.unlink(data.path);break;
    default:throw Error('Unknown operation');
   }
  }
  self.postMessage({id,value},value instanceof Uint8Array?[value.buffer]:[]);
 }catch(e){self.postMessage({id,error:e.message||String(e)});}
};
