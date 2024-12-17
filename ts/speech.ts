namespace movie_ts{

export let voiceLanguageCode : string = "eng";

const PlayMode = plane_ts.PlayMode;

const voiceMap = new Map<string, SpeechSynthesisVoice[]>();

export const langCodeList : [string, string][] = [
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
    ["por", "pt-PT"],
];

export const langCodeMap = new Map<string, string>(langCodeList);

const voiceNamesDic : { [lang: string]: string[] } = {
    "ja-JP" : [
        "Microsoft Nanami Online (Natural) - Japanese (Japan)",
        "Google 日本語",
        "Microsoft Ayumi - Japanese (Japan)"
    ]
    ,
    "en-US" : [
        "Microsoft Ava Online (Natural) - English (United States)",
        "Google US English",
        "Microsoft Zira - English (United States)"
    ]
};

let languageRegion : string;

function getVoiceByLangCode(lang_code : string) : SpeechSynthesisVoice | undefined {
    languageRegion = langCodeMap.get(lang_code)!;
    if(languageRegion == undefined){
        throw new MyError(`unknown lang code:${lang_code}`);
    }

    const voices = voiceMap.get(languageRegion);
    if(voices == undefined){
        msg(`no voice for ${languageRegion}`);
        return undefined;
    }

    const default_names = voiceNamesDic[languageRegion];
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

export class Speech extends i18n_ts.AbstractSpeech {
    voice? : SpeechSynthesisVoice;
    text!   : string;

    constructor(){ 
        super();

        i18n_ts.AbstractSpeech.one = this;

        this.initVoice();
    }

    initVoice(){
        if(voiceMap.size == 0){
            setVoiceList();
        }

        if(this.voice == undefined){

            this.voice = getVoiceByLangCode(voiceLanguageCode);
            if(this.voice != undefined){
                // msg(`use voice:${this.voice.name}`);
            }
        }
    }

    emulate(speech_id : number | undefined){
        if(theDoc == undefined){
            throw new MyError();
        }

        if(speech_id != undefined){

            let doc_speeches = docSpeeches.find(x => x.docId == theDoc!.id)
            if(doc_speeches == undefined){
                doc_speeches
                docSpeeches.push( { docId:theDoc.id, name : theDoc.name, speechIds : [speech_id]  } );
            }
            else{
                doc_speeches.speechIds.push(speech_id);
            }
        }

        let charIndex = 0;

        const id = setInterval(()=>{
            if(this.voice!.lang == "ja-JP"){
                charIndex++;
            }
            else{

                charIndex = this.text.indexOf(" ", charIndex);
                if(charIndex == -1){
                    charIndex = this.text.length;
                }
                else{
                    charIndex++;
                }
            }

            const ev : any = {
                charIndex : charIndex,
            };

            this.onBoundary(ev as SpeechSynthesisEvent);

            if(this.text.length <= charIndex){
                this.onEnd(ev as SpeechSynthesisEvent);
                clearInterval(id);
            }
        }, 1);
    }

    speak(text : string) : void {
        this.speaking = true;
        this.text = text;
        Plane.one.narration_box.setText(text);

        const speech_id = i18n_ts.getIdFromText(this.text);

        if(Plane.one.playMode == PlayMode.playAll){

            this.emulate(speech_id);
            return;
        }

        if(speech_id != undefined){
            playAudio(this, speech_id);
            return;
        }

        this.initVoice();
        msg(`Speak [${text}] ${this.voice != undefined ? this.voice.name : "no voice"}`);

        this.prevCharIndex = 0;
    
        const uttr = new SpeechSynthesisUtterance(text.replaceAll("○", "マル").replaceAll("×", "バツ"));

        uttr.addEventListener("end", this.onEnd.bind(this));
        uttr.addEventListener("boundary", this.onBoundary.bind(this));
        uttr.addEventListener("mark", this.onMark.bind(this));
    
        //uttr.rate = 5.0;// parseFloat(speechRate.value);

        if(this.voice != undefined){

            uttr.voice = this.voice;
        }

        speechSynthesis.speak(uttr);
    }

    * genSpeak(text : string){
        this.speak(text);
        while(this.speaking){
            yield;
        }
    }

    onBoundary(ev: SpeechSynthesisEvent) : void {
        const text = this.text.substring(this.prevCharIndex, ev.charIndex).trim();
        if(ev.charIndex == 0){

            msg(`Speech start text:[${this.text}]`)
        }
        else{
    
            // msg(`Speech bdr: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${text}]`);
        }
        if(this.callback != undefined){
            this.callback(ev.charIndex);
        }

        this.prevCharIndex = ev.charIndex;
    }

    onEnd(ev: SpeechSynthesisEvent) : void {
        // msg(`Speech end: idx:${ev.charIndex} name:${ev.name} type:${ev.type} text:[${this.text.substring(this.prevCharIndex)}]`);
        if(this.callback != undefined){
            this.callback(this.text.length);
        }
        this.speaking = false;
    }
    
    onMark(ev: SpeechSynthesisEvent) : void {
    }

    waitEnd() : Promise<void> {
        return new Promise((resolve) => {
            const id = setInterval(()=>{
                if(stopPlayFlag || ! this.speaking){
                    clearInterval(id);
                    resolve();
                }
            }, 10);
        });
    }

    async speak_waitEnd(text : string){
        this.speak(text);
        await this.waitEnd();
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
        // if(voice.lang == languageRegion){

            // msg(`voice lang:[${voice.lang}] name:[${voice.name}]`);
        // }

        let voice_lang = voice.lang.replaceAll("_", "-");
        const k = voice_lang.indexOf("-#");
        if(k != -1){
            voice_lang = voice_lang.substring(0, k);
            // msg(`lang:${voice.lang} => ${voice_lang}`);
        }

        if(voiceMap.get(voice_lang) == undefined){
            voiceMap.set(voice_lang, []);

            if(Array.from( langCodeMap.values() ).includes(voice_lang)){

                // msg(`voice lang:${voice_lang}`);
            }
        }

        voiceMap.get(voice_lang)!.push(voice);
    }
}

function initSpeechSub(){

    if ('speechSynthesis' in window) {
        msg("このブラウザは音声合成に対応しています。🎉");

        const speech = new Speech();
        // speech.speak("hello");
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