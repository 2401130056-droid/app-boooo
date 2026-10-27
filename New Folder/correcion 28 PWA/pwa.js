
/* PWA lifecycle. App records remain in localStorage; updates never erase them. */
(() => {
let registration=null, installPrompt=null, requestedUpdate=false;
const status=message=>{const node=document.getElementById('pwaSettingsStatus');if(node)node.textContent=message;};
const installed=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const offline=()=>{document.getElementById('pwaOffline').hidden=navigator.onLine;};
offline();window.addEventListener('online',offline);window.addEventListener('offline',offline);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('appinstalled',()=>{installPrompt=null;status('Boomerang ya está instalada.');});
function offerUpdate(){document.getElementById('pwaUpdate').hidden=false;}
function observe(reg){registration=reg;if(reg.waiting&&navigator.serviceWorker.controller)offerUpdate();reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'){if(navigator.serviceWorker.controller)offerUpdate();else status('Archivos listos para abrir la app sin conexión.');}});});}
if('serviceWorker' in navigator&&window.isSecureContext&&location.protocol!=='file:'){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(requestedUpdate)location.reload();});
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(observe).catch(()=>status('No se pudo preparar el modo sin conexión. Reintenta con conexión.'));
}
document.addEventListener('click',async e=>{
const button=e.target.closest('[data-pwa-action]');if(!button)return;
const action=button.dataset.pwaAction;
if(action==='install'){
 if(installed()){status('Boomerang ya se está ejecutando como app instalada.');return;}
 if(location.protocol==='file:'){alert('Publica todos los archivos del ZIP en Cloudflare y abre su enlace HTTPS para instalar Boomerang.');return;}
 if(installPrompt){const prompt=installPrompt;installPrompt=null;try{await prompt.prompt();const result=await prompt.userChoice;status(result.outcome==='accepted'?'Instalación solicitada.':'Puedes instalarla después desde este apartado.');}catch(error){status('Instala desde el menú del navegador.');}return;}
 alert('iPhone o iPad: abre este enlace en Safari → Compartir → Agregar a pantalla de inicio → Abrir como app web (si aparece) → Agregar.\n\nMac con Safari: Archivo → Agregar al Dock.\n\nChrome o Edge: menú del navegador → Instalar Boomerang o Instalar esta página como aplicación.');
}else if(action==='check'){
 if(!navigator.onLine){status('Conéctate a internet para buscar actualizaciones.');return;}
 if(!registration){status('La instalación y el modo sin conexión requieren el enlace HTTPS publicado.');return;}
 try{await registration.update();status(registration.waiting?'Hay una actualización disponible.':'Comprobación finalizada. Se avisará cuando una versión nueva esté lista.');if(registration.waiting)offerUpdate();}catch(error){status('No se pudo comprobar la actualización. Reintenta más tarde.');}
}else if(action==='update'){
 if(registration&&registration.waiting){requestedUpdate=true;registration.waiting.postMessage({type:'SKIP_WAITING'});}
 else{document.getElementById('pwaUpdate').hidden=true;status('No hay actualización pendiente.');}
}else if(action==='later'){document.getElementById('pwaUpdate').hidden=true;}
});
})();
