namespace movie_ts{
export let speechOn = true;

let uttrVoice : SpeechSynthesisVoice |  undefined;

let voiceLangSelect : HTMLSelectElement;
let voiceNameSelect : HTMLSelectElement;

let voiceLang = "en-US";
let voiceName : string;

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

function getVoiceByLangCode(lang_code : string) : SpeechSynthesisVoice {
    const language_region = langCodeMap.get(lang_code);
    if(language_region == undefined){
        throw new MyError();
    }

    const voices = voiceMap.get(language_region);
    if(voices == undefined){
        throw new MyError();
    }
    for(const voice of voices){
        msg(`${voice.lang} [${voice.name}] ${voice.default} ${voice.localService} ${voice.voiceURI}`);
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

let prevCharIndex = 0;
let Phrases : Phrase[] = [];
let phraseIdx : number = 0;
let wordIdx : number = 0;
let speechRate : HTMLInputElement;

export class Phrase {
    words   : string[];

    constructor(words : string[]){
        this.words   = words;
    }
}

export class Speech {
    voice : SpeechSynthesisVoice;
    prevCharIndex = 0;
    callback : ((idx:number)=>void) | undefined;
    speaking : boolean = false;

    constructor(lang_code : string){    
        if(voiceMap.size == 0){
            setVoiceList();
        }

        this.voice = getVoiceByLangCode(lang_code);
    }

    speak(text : string){
        msg(`Speak ${text}`);
        if(speechOn){

            this.prevCharIndex = 0;
        
            const uttr = new SpeechSynthesisUtterance(text);
        
            uttr.voice = this.voice;

            uttr.addEventListener("end", this.onEnd.bind(this));
            uttr.addEventListener("boundary", this.onBoundary.bind(this));
            uttr.addEventListener("mark", this.onMark.bind(this));
        
            uttr.rate = parseFloat(speechRate.value);
                
            speechSynthesis.speak(uttr);
            this.speaking = true;
        }
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

export function showSpeech(){
    $dlg("speech-dlg").showModal();
}

export function speakTest(){
    const text_area = $("text-data") as HTMLTextAreaElement;
    startSpeak(text_area.value.trim());
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

function setVoiceByLang(lang : string){
    voiceNameSelect.innerHTML = "";

    const default_names = voiceNamesDic[lang];
    let default_opt : HTMLOptionElement | undefined = undefined;

    let voice_priority = 100;
    for(const voice of voiceMap.get(lang)!){
        const opt = document.createElement("option");
        opt.text = voice.name;
        opt.value = voice.name;
        voiceNameSelect.add(opt);

        if(default_names != undefined){

            const voice_idx = default_names.indexOf(voice.name);
            if(voice_idx == -1){
                if(voice_priority == 100){
                    default_opt = opt;    
                }
            }
            else if(voice_idx < voice_priority){
                voice_priority = voice_idx;
                default_opt = opt;    
            }
        }
    }

    if(default_opt == undefined){
        default_opt = voiceNameSelect.options[0]
    }

    default_opt.selected = true;

    voiceName = default_opt.value;
    msg(`set voice name[${voiceName}]`);
    setVoice();
}

function setVoiceList(){
    for(const voice of speechSynthesis.getVoices()){
        // msg(`voice lang:${voice.lang} name:${voice.name}`);

        let voice_lang = voice.lang.replaceAll("_", "-");
        const k = voice_lang.indexOf("-#");
        if(k != -1){
            voice_lang = voice_lang.substring(0, k);
            msg(`lang:${voice.lang} => ${voice_lang}`);
        }

        if(voiceMap.get(voice_lang) == undefined){
            voiceMap.set(voice_lang, []);

            msg(`voice lang:${voice_lang}`);

            const opt = document.createElement("option");
            opt.text = voice_lang;
            opt.value = voice_lang;
            if(voice_lang == voiceLang){
                opt.selected = true;
            }
            voiceLangSelect.add(opt);
        }

        voiceMap.get(voice_lang)!.push(voice);
    }

    setVoiceByLang(voiceLang);
}

function setVoice(){
    uttrVoice = voiceMap.get(voiceLang)!.find(voice => voice.name == voiceName);
    assert(uttrVoice != undefined);
}

function initSpeechSub(){
    speechRate = $("speech-rate") as HTMLInputElement;
    voiceLangSelect = $sel("voice-lang-select");
    voiceNameSelect = $sel("voice-name-select");

    // voiceLang = voiceLangSelect.value;
    // voiceName = voiceNameSelect.value;

    voiceLangSelect.addEventListener("change", (ev:Event)=>{
        voiceLang = voiceLangSelect.value;
        msg(`voice lang changed:${voiceLang}`);
        setVoiceByLang(voiceLang);
    });

    voiceNameSelect.addEventListener("change", (ev:Event)=>{
        voiceName = voiceNameSelect.value;
        msg(`voice name changed:${voiceName}`);
        setVoice();
    });

    if ('speechSynthesis' in window) {
        msg("このブラウザは音声合成に対応しています。🎉");

        const uttr = new SpeechSynthesisUtterance("hello");
        speechSynthesis.speak(uttr);
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

export function startSpeak(text : string){
    assert(uttrVoice != null);
    msg(`speak ${text}`);

    const uttr = new SpeechSynthesisUtterance(text);

    uttr.voice = uttrVoice!;

    // スピーチ 終了
    uttr.onend = onSpeechEnd;

    // スピーチ 境界
    uttr.onboundary = onSpeechBoundary;

    uttr.onmark = onMark;

    uttr.rate = parseFloat(speechRate.value);
        
    speechSynthesis.speak(uttr);
}

export function cancelSpeech(){
    speechSynthesis.cancel();
}

export function speakNode(phrases : Phrase[]){
    console.assert(phrases.length != 0);

    const text = phrases.map(x => x.words.join(" ")).join(" ");
    msg(`speech ${text}`);

    Phrases = phrases.slice();
    phraseIdx = 0;
    wordIdx   = 0;

    startSpeak(text);
}

function onSpeechBoundary(ev: SpeechSynthesisEvent){
    const text = ev.utterance.text.substring(prevCharIndex, ev.charIndex).trim();

    if(ev.charIndex == 0){

        msg(`speech start name:${ev.name} text:[${text}]`)
    }
    else{

        msg(`speech bdr: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${text}]`);

        if(phraseIdx < Phrases.length){
            const phrase = Phrases[phraseIdx];
            if(phrase.words[wordIdx] != text){
    
                msg(`bdr [${phrase.words[wordIdx]}] <> [${text}]`)
            }
            console.assert(phrase.words[wordIdx] == text);
    
            wordIdx++;
            if(wordIdx < phrase.words.length){
                msg(`next word ${phrase.words[wordIdx]}`);
            }
            else{
                phraseIdx++;
                wordIdx = 0;
                if(phraseIdx < Phrases.length){
        
                    msg(`next phrase :${Phrases[phraseIdx].words.join(" ")}`);
                }
                else{
    
                    msg(`End of speak node`);
                }
            }
        }
    }
    prevCharIndex = ev.charIndex;
}

function onSpeechEnd(ev: SpeechSynthesisEvent){
    msg(`speech end: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${ev.utterance.text.substring(prevCharIndex)}]`);
}

function onMark(ev: SpeechSynthesisEvent){
    msg(`speech mark: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:${ev.utterance.text.substring(prevCharIndex, ev.charIndex)}`);
}
    
}