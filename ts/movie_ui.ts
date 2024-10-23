namespace movie_ts {
//
type Block = layout_ts.Block;
type Button = layout_ts.Button;

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;

export function makeEditGrid(plane : plane_ts.Plane, play_button : Button, show_contents_button : Button) : layout_ts.Grid {
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
                                text : "statement",
                                click : async (ev:MouseEvent)=>{
                                    plane_ts.StatementTool.start(ev);
                                }
                            })
                            ,
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
                                text : "Back up",
                                click : async (ev:MouseEvent)=>{
                                    await firebase_ts.BackUp(1);
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

export function makePlayGrid(plane : plane_ts.Plane, play_button : Button, show_contents_button : Button) : layout_ts.Grid {
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

}