(()=>{
const cfg=FLOW_CONFIG,channel='teacherai-mobile-flow-v1',byId=id=>document.getElementById(id);
const send=(type,extra={})=>parent.postMessage({channel,type,step:cfg.step,...extra},location.origin);
let soundState={enabled:false,playing:false,ended:false,error:false,blocked:false},matches=true;
const requestedReading=new URLSearchParams(location.search).get('reading');if(cfg.step<4&&['1','1.2','1.4'].includes(requestedReading)){const select=document.querySelector('.reading-select');if(select){select.value=requestedReading;select.dispatchEvent(new Event('change',{bubbles:true}));}}

const sound=document.createElement('button');sound.type='button';sound.id='flow-sound';sound.className='flow-sound';sound.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 4-6 5H2v6h3l6 5zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="sound-slash" d="M3 3l18 18"/></svg>';
const header=document.querySelector('.right-controls')||document.querySelector('.top-controls')||document.querySelector('.header .topline');header?.prepend(sound);
const row=document.createElement('div');row.className='flow-audio-row';row.innerHTML='<button type="button" class="flow-audio-play" id="flow-audio-play">Listen</button><span class="flow-audio-status" id="flow-audio-status" role="status"></span><button type="button" class="flow-replay" id="flow-replay" aria-label="Replay Lucas’s narration">↺</button>';
const transcript=byId('transcript');transcript.querySelector('.script').after(row);
const prompt=document.createElement('button');prompt.type='button';prompt.id='flow-autoplay';prompt.className='flow-autoplay';prompt.hidden=true;prompt.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z"/></svg><span><strong>Start with Lucas</strong><small>Tap to hear your coach</small></span>';byId('device').append(prompt);
function positionPrompt(){const device=byId('device'),footer=document.querySelector('.footer');if(footer)device.style.setProperty('--flow-prompt-bottom',Math.max(12,device.getBoundingClientRect().bottom-footer.getBoundingClientRect().top+12)+'px');}
const promptObserver=new ResizeObserver(positionPrompt);promptObserver.observe(byId('device'));promptObserver.observe(document.querySelector('.footer'));positionPrompt();
prompt.onclick=()=>{if(parent.TeacherAIFlow)parent.TeacherAIFlow.startNarration(window,cfg.step);else send('replay');};
function render(){sound.disabled=!matches;byId('flow-audio-play').disabled=!matches;byId('flow-replay').disabled=!matches;prompt.hidden=!(matches&&soundState.enabled&&soundState.blocked&&!soundState.error);sound.setAttribute('aria-label',soundState.enabled?'Turn off Lucas narration':'Listen to Lucas');sound.setAttribute('aria-pressed',String(soundState.enabled));sound.querySelector('.sound-slash').style.display=soundState.enabled?'none':'';byId('flow-audio-play').textContent=soundState.playing?'Pause':soundState.ended?'Listen again':'Listen';byId('flow-audio-status').textContent=!matches?'Script changed. This recording matches the original draft.':soundState.error?'Audio unavailable. You can read or continue.':soundState.blocked?'Tap Listen to hear Lucas.':soundState.playing?'Lucas is speaking.':soundState.ended?'End of narration.':'Lucas · '+Math.ceil(cfg.duration)+' sec';document.documentElement.dataset.narration=soundState.playing?'playing':soundState.ended?'ended':'paused';}
sound.onclick=()=>send('sound',{enabled:!soundState.enabled});byId('flow-audio-play').onclick=()=>send('toggle');byId('flow-replay').onclick=()=>send('replay');
function navigate(step){send('navigate',{target:step,search:location.search});}
if(cfg.step<3){byId('next').onclick=()=>navigate(cfg.step+1);}
if(cfg.step===3){byId('next').onclick=()=>{if(phase==='interactive'||phase==='building')navigate(4);else expand();};}
if(cfg.step===4)byId('continue').onclick=()=>{cancelTurn();navigate(5);};
if(cfg.step===4||cfg.step===5)byId('back').onclick=()=>{if(cfg.step===5)leave();else cancelTurn();navigate(cfg.step-1);};
if(cfg.step===2||cfg.step===3){const next=byId('next'),wrap=document.createElement('div'),back=document.createElement('button');wrap.className='flow-actions';back.type='button';back.className='flow-back';back.id='flow-back';back.setAttribute('aria-label','Back to page '+(cfg.step-1));back.textContent='←';next.before(wrap);wrap.append(back,next);back.onclick=()=>navigate(cfg.step-1);}
const back=document.querySelector('.flow-back,.footer>.back');if(back){back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6"/></svg>';back.setAttribute('aria-label','Back to page '+(cfg.step-1));}
if(cfg.step===3)document.querySelectorAll('.read-link.read-trigger').forEach(link=>link.remove());
if(cfg.step===5)byId('continue').addEventListener('click',()=>send('pause'));
document.querySelectorAll('.lab .local-note').forEach(el=>{el.textContent='Connected Spanish onboarding · five pages. Lucas audio follows the exact narration draft. New and newly prepared audio still needs listening review. No course progress is saved.';});
document.querySelectorAll('.lab p').forEach(el=>{if(/No Lucas recording|No recording is attached/i.test(el.textContent))el.textContent='Lucas narration connected. Use the sound control or Lucas’s avatar drawer to listen.';});
document.querySelectorAll('.audio-input').forEach(el=>{el.closest('label')?.classList.add('audio-input-label');});
document.querySelectorAll('#controls p').forEach(el=>{if(/No (?:Lucas|recording)|no synthesis|not generated|not.*attached/i.test(el.textContent))el.textContent='Lucas narration is connected in this combined preview. Changing the script disables its recording until the original text is restored.';});
const localStatus=byId('local-file-status');if(localStatus)localStatus.textContent='Lucas narration connected.';
function checkText(){matches=byId('full-script').textContent===cfg.narration;send('match',{matches});render();}
new MutationObserver(checkText).observe(byId('full-script'),{subtree:true,childList:true,characterData:true});
document.addEventListener('input',event=>{if(event.target.matches('.narration-editor,#narration-editor'))queueMicrotask(checkText);});
document.addEventListener('change',()=>queueMicrotask(()=>send('settings',{search:location.search,reading:getComputedStyle(byId('device')).getPropertyValue('--reading').trim()})));
document.addEventListener('click',event=>{if(event.target.closest('#show-controls,.open-controls'))send('pause');if(cfg.step===5&&event.target.closest('#listen,#record,#play-take,#quiet'))send('pause');},true);
document.addEventListener('play',event=>{if(event.target instanceof HTMLMediaElement)send('pause');},true);
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.channel!==channel)return;const message=event.data;if(message.type==='state'){soundState=message.state;render();}if(message.type==='cue'&&cfg.step===3)document.dispatchEvent(new CustomEvent('teacherai:narration-cue',{detail:{pageId:cfg.pageId,cue:'bricks-definition'}}));if(message.type==='stop-local'){document.querySelectorAll('audio').forEach(a=>a.pause());if(cfg.step===5)leave();}if(message.type==='focus-heading'){document.querySelector('main h1')?.focus({preventScroll:true});}});
document.querySelectorAll('.read-trigger,.open-transcript').forEach(button=>button.setAttribute('aria-label','Read or listen to Lucas’s full narration'));
render();send('ready',{search:location.search});
})();
