namespace movie_ts {
//

export let theDoc : firebase_ts.DbDoc | undefined;
export let root : layout_ts.Grid;
export let urlOrigin : string;

const $button = layout_ts.$button;

const PlayMode = plane_ts.PlayMode;

export async function bodyOnLoad(){
    document.body.style.color = plane_ts.fgColor;
    document.body.style.backgroundColor = plane_ts.bgColor;

    const [ origin, pathname, params] = i18n_ts.parseURL();
    urlOrigin = origin;
    msg(`params:${JSON.stringify(params) }`);

    const edit_mode = (params.get("mode") == "edit");

    i18n_ts.initI18n();

    const plane = new plane_ts.Plane();
    let root : layout_ts.Grid;

    const play_button = $button({
        text : "Play",
        click : async (ev : MouseEvent)=>{
            await play(PlayMode.normal);
        }
    });

    const stop_button = $button({
        text : "Stop",
        click : async (ev : MouseEvent)=>{
            stopPlay();
        }
    });

    const show_contents_button = $button({
        id : "show-contents",
        text : "show contents",
        click : async (ev : MouseEvent)=>{
            firebase_ts.showContents(readDoc);
        }
    });

    if(edit_mode){

        root = makeEditGrid(plane, play_button, stop_button, show_contents_button);
    }
    else{
        root = makePlayGrid(plane, play_button, stop_button, show_contents_button);
    }

    layout_ts.initLayout(root);

    i18n_ts.initLanguageBar($("language-bar"));

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
}

export async function readDoc(id : number) {
    // msg(`id:${id}`);
    theDoc = await firebase_ts.getDoc(id);
    if(theDoc != undefined){

        // msg(`read doc:${theDoc.id} ${theDoc.name}`)
        const obj = JSON.parse(theDoc.text);
        plane_ts.loadData(obj);

        i18n_ts.initLanguageBar($("language-bar"), id);
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