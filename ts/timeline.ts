namespace movie_ts {
//
export let  docSpeeches : { docId : number, name : string, speechIds: number[]}[];
let audio : HTMLAudioElement | undefined;

function getAudioPath(lang_code: string, speech_id : number) : string {
    return `${urlOrigin}/lib/i18n/audio/${lang_code}/${speech_id}.mp3`;
}

export function playAudio(speech : Speech, speech_id : number){

    audio = document.createElement("audio");
    document.body.append(audio);
    
    let can_play_through = false;

    audio.addEventListener("canplaythrough", (ev:Event)=>{
        msg("can play");
        can_play_through = true;
    });

    audio.addEventListener("ended", (ev : Event)=>{
        msg("audio ended");

        const charIndex = speech.text.length;
        speech.onBoundary({ charIndex } as SpeechSynthesisEvent);
        speech.onEnd({} as SpeechSynthesisEvent);

        document.body.removeChild(audio!);
        audio = undefined;
    });

    const audio_path = getAudioPath(voiceLanguageCode, speech_id);
    msg(`${audio_path}`);
    audio.src = audio_path;
    const timer_id = setInterval(()=>{
        if(can_play_through){
            clearInterval(timer_id);
            audio!.play();
        }
    }, 10);

    speech.speaking = true;
}

export function stopAudio(){
    if(audio != undefined){
        audio.pause();

        document.body.removeChild(audio);
        audio = undefined;
    }
}
}