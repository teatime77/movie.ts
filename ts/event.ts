namespace movie_ts {
//
let theDoc : firebase_ts.DbDoc | undefined;

export async function bodyOnLoad(){
    i18n_ts.initI18n();
    plane_ts.initPlane($div("menu-bar"), $div("shape-tool"), $div("canvas-div"), $div("property-div"));
    
    await includeDialog("./lib/firebase/dialog.html");
    await includeDialog("./lib/movie/dialog.html");

    await asyncInitSpeech();

    firebase_ts.initFirebase();

    $("movie-play").addEventListener("click", async (ev : MouseEvent)=>{
        await play();
    })

    $("movie-write-db").addEventListener("click", (ev : MouseEvent)=>{
        writeDB();
    });

    $("movie-show-firebase").addEventListener("click", (ev : MouseEvent)=>{
        $dlg("firebase-menu").showModal();        
    });


    $("show-contents").addEventListener("click", (ev : MouseEvent)=>{
        firebase_ts.showContents(readDoc);
    });
}

async function readDoc(id : number) {
    msg(`id:${id}`);
    theDoc = await firebase_ts.getDoc(id);
    if(theDoc != undefined){

        msg(`read doc:${theDoc.id} ${theDoc.name}`)
        const obj = JSON.parse(theDoc.text);
        plane_ts.loadData(obj);
    }
}

async function writeDB(){
    let default_name = (theDoc == undefined ? "" : theDoc.name);

    let name = prompt("Enter the document name.", default_name);
    if(name == null || name.trim() == ""){
        return ["", ""];
    }
    name = name.trim();

    const json = plane_ts.View.getJson();
    if(json == ""){
        return;
    }

    if(theDoc == undefined){
        const root_folder = firebase_ts.getRootFolder();
        if(root_folder == null){
            return;
        }
        try{

            theDoc = await firebase_ts.putDoc(root_folder, name, json);
        }
        catch(e){
            throw new MyError(`${e}`);
        }
    }
    else{
        theDoc.setName(name);
        theDoc.text = json;
        theDoc.update();
    }
}

export function SignUp(){
    $dlg("sign-up").showModal();
}
}