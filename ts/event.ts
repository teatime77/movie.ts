namespace movie_ts {
//
let theDoc : firebase_ts.DbDoc | undefined;
export let root : layout_ts.Grid;

const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;

export async function bodyOnLoad(){
    i18n_ts.initI18n();

    root = makeGrid();
    layout_ts.initLayout(root);


    i18n_ts.initLanguageBar($("language-bar"));

    plane_ts.initPlane($("menu-bar"), $div("shape-tool"), $div("canvas-div"), $div("property-div"));
    
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

function makeGrid(){

    const root = $grid({
        rows     : "50px 50px 100%",
        children:[
            $block({
                id : "language-bar",
                children : [],
                backgroundColor : "chocolate",
            })
            ,
            $grid({
                columns  : "50% 50%",
                children: [
                    $block({
                        id : "menu-bar",
                        children : [],
                        backgroundColor : "lime",
                    })
                    ,
                    $block({
                        children : [
                            $button({
                                id : "movie-play",
                                text : "Play"
                            })
                            ,
                            $button({
                                id : "movie-write-db",
                                text : "Write DB"
                            })
                            ,
                            $button({
                                id : "movie-show-firebase",
                                text : "firebase"
                            })
                            ,
                            $button({
                                id : "show-contents",
                                text : "show contents"
                            })
                            ,
                        ],
                        backgroundColor : "violet",
                    })
                ]
            })
            ,
            $grid({
                columns  : "50px 50% 50% 300px",

                children : [
                    $block({
                        id : "shape-tool",
                        children : [],
                        backgroundColor : "green",
                    })
                    ,
                    $block({
                        children : [],
                        aspectRatio : 1,
                        backgroundColor : "blue",
                    })
                    ,
                    $block({
                        id : "canvas-div",
                        children : [],
                        aspectRatio : 1,
                        backgroundColor : "orange",
                    })
                    ,
                    $block({
                        id : "property-div",
                        children : [],
                        backgroundColor : "cyan",
                    }),
                ]
            })
        ]
    });

    return root;    
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