namespace movie_ts {
//

export let theDoc : firebase_ts.DbDoc | undefined;
export let root : layout_ts.Grid;
export let urlOrigin : string;
export let playStopButton : layout_ts.Button;

const $button = layout_ts.$button;
const $flex = layout_ts.$flex;

const PlayMode = plane_ts.PlayMode;

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

    const edit_mode = (params.get("mode") == "edit");

    i18n_ts.initI18n();

    const plane = new plane_ts.Plane();
    let root : layout_ts.Grid;

    const button_size = window.innerHeight / 16;

    playStopButton = $button({
        id : "play-stop-button",
        click : async (ev : MouseEvent)=>{
            if(Plane.one.playMode == PlayMode.stop){

                playStopButton.setImgUrl(`${urlOrigin}/lib/plane/img/pause.png`);
                await play(PlayMode.normal);
            }
            else{
                stopPlay();
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
                    firebase_ts.showContents(readDoc);
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


    if(edit_mode){

        root = makeEditGrid(plane, play_buttons, button_size);
    }
    else{
        root = makePlayGrid(plane, play_buttons, button_size);
    }

    layout_ts.initLayout(root);

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

function inputDocName(default_name : string) : string {
    let name = prompt("Enter the document name.", default_name);
    if(name == null || name.trim() == ""){
        return "";
    }

    return name.trim();
}

export async function putNewDoc(){
    let default_name = "";

    if(theDoc != undefined){
        if(!confirm("document is already read.\nSave as another file?")){
            return;
        }
        default_name = theDoc.name;
    }

    const name = inputDocName(default_name);
    if(name == ""){
        return;
    }

    const json = plane_ts.View.getJson();
    if(json == ""){
        return;
    }
    msg(`json:[${json}]`);

    const root_folder = await firebase_ts.getRootFolder();
    if(root_folder == null){
        throw new MyError("can not get root folder.");
    }

    try{
        theDoc = await firebase_ts.putDoc(root_folder, name, json);
    }
    catch(e){
        throw new MyError(`${e}`);
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

    const name = inputDocName(theDoc.name);
    if(name == ""){
        return;
    }

    const json = plane_ts.View.getJson();
    if(json == ""){
        return;
    }

    theDoc.setName(name);
    theDoc.text = json;
    theDoc.updateDocDB(user.uid);
}

export function SignUp(){
    $dlg("sign-up").showModal();
}

}