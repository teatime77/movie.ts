namespace movie_ts {
//

type Block = layout_ts.Block;
type Button = layout_ts.Button;
const Statement = plane_ts.Statement;

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;

type Flex = layout_ts.Flex;

export function makeEditGrid(plane : plane_ts.Plane, play_buttons : Flex) : layout_ts.Grid {
    const root = $grid({
        rows     : "25px 25px 864px 48px",
        children:[
            $block({
                id : "language-bar",
                children : [],
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
                                text : "new doc",
                                click : async (ev:MouseEvent)=>{
                                    putNewDoc();
                                }
                            })
                            ,
                            $button({
                                text : "update doc",
                                click : async (ev:MouseEvent)=>{
                                    updateDoc();
                                }
                            })
                            ,
                            $button({
                                text : "play all",
                                click : async (ev:MouseEvent)=>{
                                    await playAll();
                                }
                            })
                            ,
                            $button({
                                text : "Back up",
                                click : async (ev:MouseEvent)=>{
                                    if(confirm(TT("Do you want to start the backup?"))){

                                        await firebase_ts.BackUp(1);
                                    }
                                }
                            })
                            ,
                            $button({
                                text : "convert",
                                click : async (ev:MouseEvent)=>{
                                    if(confirm(TT("Do you want to start the conversion?"))){

                                        await convert();
                                    }
                                }
                            })
                            ,
                            $button({
                                text : "firebase",
                                click : async (ev:MouseEvent)=>{
                                    $dlg("firebase-menu").showModal();        
                                }
                            })
                            ,
                            $button({
                                text : "log",
                                click : async (ev:MouseEvent)=>{
                                    layout_ts.Log.show(ev);
                                }
                            })
                        ],
                    })
                ]
            })
            ,
            $grid({
                columns  : "72px 486px 40px 300px",

                children : [
                    plane.tool_block
                    ,
                    $grid({
                        id : "canvas-narration",
                        rows  : "486px 378px",
                        children : [
                            plane.canvas_block
                            ,
                            plane.narration_box        
                        ]
                    })
                    ,
                    plane.shapes_block
                    ,
                    plane.property_block
                ]
            })
            ,
            play_buttons
        ]
    });

    return root;    
}

export function makePlayGrid(plane : plane_ts.Plane, play_buttons : Flex) : layout_ts.Grid {
    let content_grid : layout_ts.Grid;
    const horizontal = false;
    if(horizontal){
        content_grid = $grid({
            children : [
                $grid({
                    columns  : "50% 50%",

                    children : [
                        plane.narration_box
                        ,
                        plane.canvas_block
                    ]        
                })
            ]
        })
    }
    else{

        content_grid = $grid({
            id : "canvas-narration",
            rows  : "486px 378px",
            children : [
                plane.canvas_block
                ,
                plane.narration_box
            ]
        })
    }
    
    const root = $grid({
        width : "486px",
        rows     : "25px 864px 48px",
        children:[
            $block({
                id : "language-bar",
                children : [],
            })
            ,
            $grid({
                columns : "486px",
                children : [
                    content_grid
                ]
            })
            ,
            play_buttons
        ]
    });

    return root;    
}

}