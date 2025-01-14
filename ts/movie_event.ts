namespace movie_ts {
//

export let theDoc : firebase_ts.DbDoc | undefined;
export let root : layout_ts.Grid;
export let urlOrigin : string;
export let urlParams : Map<string, string>;
export let playStopButton : layout_ts.Button;

const $button = layout_ts.$button;
const $flex = layout_ts.$flex;

const PlayMode = plane_ts.PlayMode;

export const AppMode = i18n_ts.AppMode;

export async function bodyOnLoad(){
    [ urlOrigin, , urlParams] = i18n_ts.parseURL();
    msg(`params:${JSON.stringify(urlParams) }`);

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
    if(urlParams.get("lesson") != undefined || urlParams.get("mode") == "lesson"){

        voiceLanguageCode = "jpn";
    }

    if(text_lang != undefined){
        i18n_ts.setTextLanguageCode(text_lang);
    }

    msg(`lang voice:${voiceLanguageCode} text:${text_lang} nav:${navigator.language}`);

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

                case AppMode.lessonPlay:
                case AppMode.lessonEdit:
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

                case AppMode.lessonPlay:
                case AppMode.lessonEdit:
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
        // position : "static",
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

                    case AppMode.lessonEdit:
                        firebase_ts.showContents(readLesson, undefined);
                        break;
                    default:
                        throw new MyError();
                    }
                },
                url    : `${urlOrigin}/lib/plane/img/bullet-list.png`,
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

    case AppMode.lessonPlay:
        initLesson();
        root = makeLessonPlayGrid(button_size);
        playStopButton.button.style.visibility = "hidden";
        break;
    
    case AppMode.lessonEdit:
        initLesson();
        root = makeLessonEditGrid(play_buttons, button_size);
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
    firebase_ts.readDocFnc = readDoc;

    if(i18n_ts.appMode == AppMode.lessonPlay){
        firebase_ts.refId = "wutfxujVE0GGD5YW";
        msg(`set ref-ID:[${firebase_ts.refId}]`);
    }

    const size = layout_ts.getPhysicalSize();
    msg(`size:${size.width_cm.toFixed(1)} ${size.height_cm.toFixed(1)}`);
    msg(`navigator:${navigator.appVersion}`);

    plane_ts.initRelations();

    const doc_id = urlParams.get("id");
    if(doc_id != undefined){

        const root_folder = await firebase_ts.getRootFolder();

        await readDoc(parseInt(doc_id));
    }

    const buttons = document.getElementsByClassName("lang_button") as HTMLCollectionOf<HTMLButtonElement>;
    for(const button of buttons){
        button.addEventListener("click", langButtonClicked);
    }

    if(i18n_ts.appMode == AppMode.lessonPlay){
        await initLessonPlay();
    }
    else if(i18n_ts.appMode != AppMode.lessonEdit){

        await firebase_ts.makeDocsGraph();
    }
}

export async function readDoc(doc_id : number) {
    // msg(`id:${id}`);
    theDoc = await firebase_ts.getDoc(doc_id);
    if(theDoc != undefined){

        // msg(`read doc:${theDoc.id} ${theDoc.name}`)
        const obj = JSON.parse(theDoc.text);
        plane_ts.loadData(doc_id, obj);
    }
}

export async function createDoc() {
    const doc_text = plane_ts.View.getJson();
    if(doc_text == ""){
        return;
    }

    firebase_ts.showContents(undefined, doc_text);
}

export async function uploadThumbnail(){
    await firebase_ts.uploadCanvasImg(View.current.canvas.canvas);
}

export async function updateGraphDoc(){
    const json_text = plane_ts.View.getJson();
    if(json_text == ""){
        return;
    }

    await firebase_ts.writeGraphDocDB(json_text);

    await uploadThumbnail();
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

    await uploadThumbnail();
}

export function SignUp(){
    $dlg("sign-up").showModal();
}

}