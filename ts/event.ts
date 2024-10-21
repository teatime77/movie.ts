namespace movie_ts {
//
type Block = layout_ts.Block;
type Button = layout_ts.Button;

let theDoc : firebase_ts.DbDoc | undefined;
export let root : layout_ts.Grid;

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;

export async function bodyOnLoad(){
    const params = getQueryParams(document.location.href);
    msg(`params:${JSON.stringify(params) }`);

    const edit_mode = (params["mode"] == "edit");

    i18n_ts.initI18n();

    const plane = new plane_ts.Plane();
    let root : layout_ts.Grid;

    const play_button = $button({
        id : "movie-play",
        text : "Play",
        click : async (ev : MouseEvent)=>{
            await play();
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

        root = makeEditGrid(plane, play_button, show_contents_button);
    }
    else{
        root = makePlayGrid(plane, play_button, show_contents_button);
    }

    layout_ts.initLayout(root);

    if(edit_mode){

        $("movie-write-db").addEventListener("click", (ev : MouseEvent)=>{
            writeDB();
        });

        $("movie-show-firebase").addEventListener("click", (ev : MouseEvent)=>{
            $dlg("firebase-menu").showModal();        
        });
    }

    i18n_ts.initLanguageBar($("language-bar"));

    plane_ts.initPlane(plane, root);
    
    await includeDialog("./lib/firebase/dialog.html");
    await includeDialog("./lib/movie/dialog.html");

    // await asyncInitSpeech();
    initSpeech();

    firebase_ts.initFirebase();

    const size = layout_ts.getPhysicalSize();
    msg(`size:${size.width_cm.toFixed(1)} ${size.height_cm.toFixed(1)}`);
    msg(`navigator:${navigator.appVersion}`);
}

function makeEditGrid(plane : plane_ts.Plane, play_button : Button, show_contents_button : Button) : layout_ts.Grid {
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
                            play_button
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
                            show_contents_button
                            ,
                            $button({
                                text : "log",
                                click : async (ev:MouseEvent)=>{
                                    layout_ts.Log.show(ev);
                                }
                            })
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

function makePlayGrid(plane : plane_ts.Plane, play_button : Button, show_contents_button : Button) : layout_ts.Grid {
    let content_grid : layout_ts.Grid;
    if(window.innerHeight < window.innerWidth ){
        content_grid = $grid({
            columns  : "50% 50%",

            children : [
                plane.text_block
                ,
                plane.canvas_block
            ]
        })
    }
    else{

        content_grid = $grid({
            rows  : "50% 50%",

            children : [
                plane.canvas_block
                ,
                plane.text_block
            ]
        })
    }
    
    const root = $grid({
        rows     : "25px 25px 100% 25px",
        children:[
            $block({
                id : "language-bar",
                children : [],
                backgroundColor : "chocolate",
            })
            ,
            $flex({
                children : [
                    play_button
                    ,
                    show_contents_button
                    ,
                    $button({
                        text : "log",
                        click : async (ev:MouseEvent)=>{
                            layout_ts.Log.show(ev);
                        }
                    })
                ],
                backgroundColor : "violet",
            })
            ,
            content_grid
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