// One short, quiet UI tone. No audio files, continuous processing or player-window echo.
export function schedulePingTone(context){
  const start=context.currentTime,oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.type='sine';
  oscillator.frequency.setValueAtTime(660,start);
  oscillator.frequency.exponentialRampToValueAtTime(440,start+.13);
  gain.gain.setValueAtTime(0,start);
  gain.gain.linearRampToValueAtTime(.09,start+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,start+.17);
  gain.gain.linearRampToValueAtTime(0,start+.19);
  oscillator.connect(gain);gain.connect(context.destination);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  oscillator.start(start);oscillator.stop(start+.2);
}

export function createPingSound(){
  let context=null,disposed=false;
  function prepare(){
    try{
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(disposed||!Audio)return;
      context??=new Audio();
      if(context.state==='suspended')void context.resume().catch(()=>{});
    }catch{/* The marker does not depend on audio availability. */}
  }
  return {
    prepare,
    async play(){
      const requested=performance.now();
      try{
        prepare();
        if(disposed||!context)return;
        if(context.state==='suspended')await context.resume();
        // A browser-blocked tone must not play much later after an unrelated click.
        if(!disposed&&context.state==='running'&&performance.now()-requested<300)schedulePingTone(context);
      }catch{/* Sound is optional; the visual ping always works. */}
    },
    dispose(){disposed=true;if(context&&context.state!=='closed')void context.close().catch(()=>{});}
  };
}
