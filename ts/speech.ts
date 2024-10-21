namespace movie_ts{

const voiceMap = new Map<string, SpeechSynthesisVoice[]>();

const langCodeMap = new Map<string, string>([
    ["ara", "ar-EG"],
    ["chi", "zh-CN"],
    ["eng", "en-US"],
    ["fre", "fr-FR"],
    ["ger", "de-DE"],
    ["hin", "hi-IN"],
    ["ind", "id-ID"],
    ["jpn", "ja-JP"],
    ["kor", "ko-KR"],
    ["rus", "ru-RU"],
    ["spa", "es-ES"],
]);

const voiceNamesDic : { [lang: string]: string[] } = {
    "ja-JP" : [
        "Microsoft Nanami Online (Natural) - Japanese (Japan)",
        "Microsoft Ayumi - Japanese (Japan)",
        "Google 日本語"
    ]
    ,
    "en-US" : [
        "Microsoft Ava Online (Natural) - English (United States)"
    ]
};

function getVoiceByLangCode(lang_code : string) : SpeechSynthesisVoice | undefined {
    const language_region = langCodeMap.get(lang_code);
    if(language_region == undefined){
        msg(`unknown lang code:${lang_code}`);
        return undefined;
    }

    const voices = voiceMap.get(language_region);
    if(voices == undefined){
        msg(`no voice for ${language_region}`);
        return undefined;
    }

    const default_names = voiceNamesDic[language_region];
    if(default_names != undefined){
        for(const name of default_names){
            const voice = voices.find(x => x.name == name);
            if(voice != undefined){
                return voice;
            }
        }
    }

    const natural_voice = voices.find(x => x.name.indexOf("Online (Natural)") != -1);
    if(natural_voice != undefined){
        return natural_voice;
    }

    return voices[0];
}

export class Speech {
    voice? : SpeechSynthesisVoice;
    prevCharIndex = 0;
    callback : ((idx:number)=>void) | undefined;
    speaking : boolean = false;

    constructor(lang_code : string){    
        if(voiceMap.size == 0){
            setVoiceList();
        }

        this.voice = getVoiceByLangCode(lang_code);
        if(this.voice != undefined){
            msg(`use voice:${this.voice.name}`);
        }
    }

    speak(text : string){
        msg(`Speak [${text}] ${this.voice != undefined ? this.voice.name : "no voice"}`);

        this.prevCharIndex = 0;
    
        const uttr = new SpeechSynthesisUtterance(text);

        uttr.addEventListener("end", this.onEnd.bind(this));
        uttr.addEventListener("boundary", this.onBoundary.bind(this));
        uttr.addEventListener("mark", this.onMark.bind(this));
    
        // uttr.rate = parseFloat(speechRate.value);

        if(this.voice != undefined){

            uttr.voice = this.voice;
        }

        speechSynthesis.speak(uttr);
        this.speaking = true;
    }

    * genSpeak(text : string){
        this.speak(text);
        while(this.speaking){
            yield;
        }
    }

    onBoundary(ev: SpeechSynthesisEvent) : void {
        const text = ev.utterance.text.substring(this.prevCharIndex, ev.charIndex).trim();
        if(ev.charIndex == 0){

            msg(`Speech start name:${ev.name} text:[${ev.utterance.text}]`)
        }
        else{
    
            msg(`Speech bdr: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${text}]`);
        }
        if(this.callback != undefined){
            this.callback(ev.charIndex);
        }

        this.prevCharIndex = ev.charIndex;
    }

    onEnd(ev: SpeechSynthesisEvent) : void {
        msg(`Speech end: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${ev.utterance.text.substring(this.prevCharIndex)}]`);
        if(this.callback != undefined){
            this.callback(ev.utterance.text.length);
        }
        this.speaking = false;
    }
    
    onMark(ev: SpeechSynthesisEvent) : void {
    }

    async waitEnd() : Promise<void> {
        return new Promise((resolve) => {
            const id = setInterval(()=>{
                if(! this.speaking){
                    clearInterval(id);
                    resolve();
                }
            }, 10);
        });
    }
}

export function pronunciation(word: string) : string[]{
    if(word[0] == '\\'){
        const tbl : {[key:string]:string[]} = {
            "dif" : ["diff"],
            "Delta" : ["delta"],
            "lim" : ["limit"],
            "frac" : ["fraction"],
            "sqrt" : "square root".split(" "),
            "ne" : "not equals".split(" "),
            "lt" : "is less than".split(" "),
            "gt" : "is greater than".split(" "),
            "le" : "is less than or equals".split(" "),
            "ge" : "is greater than or equals".split(" "),
        };

        const name = word.substring(1);
        if(name in tbl){
            return tbl[name];
        }
        else{
            return [name];
        }
    }
    
    return [word];
}


function setVoiceList(){
    const voices = Array.from(speechSynthesis.getVoices());
    if(voices.length == 0){
        msg("no voice");
        return;
    }

    for(const voice of voices){
        // msg(`voice lang:${voice.lang} name:${voice.name}`);

        let voice_lang = voice.lang.replaceAll("_", "-");
        const k = voice_lang.indexOf("-#");
        if(k != -1){
            voice_lang = voice_lang.substring(0, k);
            // msg(`lang:${voice.lang} => ${voice_lang}`);
        }

        if(voiceMap.get(voice_lang) == undefined){
            voiceMap.set(voice_lang, []);

            if(Array.from( langCodeMap.values() ).includes(voice_lang)){

                msg(`voice lang:${voice_lang}`);
            }
        }

        voiceMap.get(voice_lang)!.push(voice);
    }
}

function initSpeechSub(){

    if ('speechSynthesis' in window) {
        msg("このブラウザは音声合成に対応しています。🎉");

        const speech = new Speech(i18n_ts.languageCode);
        speech.speak("hello");
    }
    else {
        msg("このブラウザは音声合成に対応していません。😭");
    }    
}

export function initSpeech(){
    initSpeechSub();

    speechSynthesis.onvoiceschanged = function(){
        msg("voices changed 1");
        setVoiceList();
    };

    speechSynthesis.addEventListener("voiceschanged", (ev:Event)=>{
        setVoiceList();
        msg("voices changed 2");
    })

}

export async function asyncInitSpeech() : Promise<void> {
    initSpeechSub();

    return new Promise((resolve) => {
        speechSynthesis.addEventListener("voiceschanged", (ev:Event)=>{
            setVoiceList();
            msg("speech initialized");
            resolve();
        })
    });
}

export function cancelSpeech(){
    speechSynthesis.cancel();
}

    
}