namespace movie_ts {
//

export let theDoc : firebase_ts.DbDoc | undefined;
export let root : layout_ts.Grid;
export let urlOrigin : string;
export let playStopButton : layout_ts.Button;

const $button = layout_ts.$button;
const $flex = layout_ts.$flex;

const PlayMode = plane_ts.PlayMode;

const AppMode = i18n_ts.AppMode;

export async function bodyOnLoad(){
    document.body.style.color = layout_ts.fgColor;
    document.body.style.backgroundColor = layout_ts.bgColor;

    let voice_lang = getCookie("VoiceLanguage");
    let text_lang  = getCookie("TextLanguage");

    if(voice_lang == undefined || text_lang == undefined){
        const code_pair = langCodeList.find(x => x[1] == navigator.language);
        if(code_pair != undefined){
            if(voice_lang == undefined){
                voice_lang = code_pair[0];
            }

            if(text_lang == undefined){
                text_lang = code_pair[0];
            }
        }
    }

    if(voice_lang != undefined){
        voiceLanguageCode = voice_lang;
    }

    if(text_lang != undefined){
        i18n_ts.setTextLanguageCode(text_lang);
    }

    msg(`lang voice:${voice_lang} text:${text_lang} nav:${navigator.language}`);

    const [ origin, pathname, params] = i18n_ts.parseURL();
    urlOrigin = origin;
    msg(`params:${JSON.stringify(params) }`);

    i18n_ts.initI18n();

    const plane = new plane_ts.Plane();
    let root : layout_ts.Grid;

    const button_size = window.innerHeight / 16;

    playStopButton = $button({
        id : "play-stop-button",
        click : async (ev : MouseEvent)=>{
            if(Plane.one.playMode == PlayMode.stop){

                playStopButton.setImgUrl(`${urlOrigin}/lib/plane/img/pause.png`);

                switch(i18n_ts.appMode){
                case AppMode.edit:
                case AppMode.play:
                    await playView(PlayMode.normal);
                    break;

                case AppMode.lesson:
                    await playLesson();
                    break;

                default:
                    throw new MyError();
                }
            }
            else{
                switch(i18n_ts.appMode){
                case AppMode.edit:
                case AppMode.play:
                    stopPlay();
                    break;

                case AppMode.lesson:
                    stopPlay();
                    // await stopLesson();
                    break;

                default:
                    throw new MyError();
                }

                playStopButton.setImgUrl(`${urlOrigin}/lib/plane/img/play.png`);
            }
        },
        url    : `${urlOrigin}/lib/plane/img/play.png`,
        position : "static",
        margin : "auto 5px",
        width  : `${button_size}px`,
        height : `${button_size}px`,
    });

    const play_buttons = $flex({
        children : [
            $button({
                id : "show-contents",
                click : async (ev : MouseEvent)=>{
                    switch(i18n_ts.appMode){
                    case AppMode.edit:
                    case AppMode.play:
                        firebase_ts.showContents(readDoc, undefined);
                        break;

                    case AppMode.lesson:
                        firebase_ts.showContents(readLesson, undefined);
                        break;
                    default:
                        throw new MyError();
                    }
                },
                url    : `${urlOrigin}/lib/plane/img/bullet-list.png`,
                position : "static",
                margin : "auto 5px",
                width  : `${button_size}px`,
                height : `${button_size}px`,
            })
            ,
            playStopButton
            ,
            $button({
                click : async (ev : MouseEvent)=>{
                    showLangDlg(true);
                },
                url    : `${urlOrigin}/lib/plane/img/volume.png`,
                position : "static",
                margin : "auto 5px",
                width  : `${button_size}px`,
                height : `${button_size}px`,
            })
            ,
            $button({
                click : async (ev : MouseEvent)=>{
                    showLangDlg(false);
                },
                url    : `${urlOrigin}/lib/plane/img/subtitle.png`,
                position : "static",
                margin : "auto 5px",
                width  : `${button_size}px`,
                height : `${button_size}px`,
            })
        ]
    });

    play_buttons.div.style.display = "flex";
    play_buttons.div.style.alignItems = "center";
    play_buttons.div.style.justifyContent = "center";


    switch(i18n_ts.appMode){
    case AppMode.edit:
        root = makeEditGrid(plane, play_buttons, button_size);
        break;
    case AppMode.lesson:
        initLesson();
        root = makeLessonGrid(play_buttons, button_size);
        break;
    case AppMode.play:
    default:
        root = makePlayGrid(plane, play_buttons, button_size);
        break;
    }

    layout_ts.Layout.initLayout(root);

    plane_ts.initPlane(plane, root);
    
    await includeDialog("./lib/firebase/dialog.html");
    await includeDialog("./lib/movie/dialog.html");

    // await asyncInitSpeech();
    initSpeech();

    await firebase_ts.initFirebase();

    const size = layout_ts.getPhysicalSize();
    msg(`size:${size.width_cm.toFixed(1)} ${size.height_cm.toFixed(1)}`);
    msg(`navigator:${navigator.appVersion}`);

    const doc_id = params.get("id");
    if(doc_id != undefined){

        const root_folder = await firebase_ts.getRootFolder();

        await readDoc(parseInt(doc_id));
    }

    const buttons = document.getElementsByClassName("lang_button") as HTMLCollectionOf<HTMLButtonElement>;
    for(const button of buttons){
        button.addEventListener("click", langButtonClicked);
    }
}

export async function readDoc(id : number) {
    // msg(`id:${id}`);
    theDoc = await firebase_ts.getDoc(id);
    if(theDoc != undefined){

        // msg(`read doc:${theDoc.id} ${theDoc.name}`)
        const obj = JSON.parse(theDoc.text);
        plane_ts.loadData(obj);
    }
}

export async function updateDoc(){
    const user = firebase_ts.getUser();
    if(user == null){
        throw new MyError();
    }

    if(theDoc == undefined){
        alert("no document");
        return;
    }

    const name = firebase_ts.inputDocName(theDoc.name);
    if(name == ""){
        return;
    }

    const json = plane_ts.View.getJson();
    if(json == ""){
        return;
    }

    theDoc.setName(name);
    theDoc.text = json;
    await theDoc.updateDocDB();
}

export function SignUp(){
    $dlg("sign-up").showModal();
}

}