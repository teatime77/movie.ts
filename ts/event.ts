namespace movie_ts {
//
type Block = layout_ts.Block;

let theDoc : firebase_ts.DbDoc | undefined;
export let root : layout_ts.Grid;

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;

export async function bodyOnLoad(){
    i18n_ts.initI18n();

    const plane = new plane_ts.Plane();
    const root = makeGrid(plane);
    layout_ts.initLayout(root);

    i18n_ts.initLanguageBar($("language-bar"));

    plane_ts.initPlane(plane, root);
    
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

function makeGrid(plane : plane_ts.Plane) : layout_ts.Grid {
    const root = $grid({
        rows     : "25px 25px 100% 25px",
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
                    plane.menu_block
                    ,
                    $flex({
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
                    plane.tool_block
                    ,
                    plane.text_block
                    ,
                    plane.canvas_block
                    ,
                    plane.property_block
                ]
            })
            ,
            plane.shapes_block
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