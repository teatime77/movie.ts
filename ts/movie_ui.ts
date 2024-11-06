namespace movie_ts {
//
const TT = i18n_ts.TT;

type Block = layout_ts.Block;
type Button = layout_ts.Button;
const Statement = plane_ts.Statement;

const $flex = layout_ts.$flex;
const $grid = layout_ts.$grid;
const $block = layout_ts.$block;
const $button = layout_ts.$button;

export function makeEditGrid(plane : plane_ts.Plane, play_button : Button, stop_button : Button, show_contents_button : Button) : layout_ts.Grid {
    const root = $grid({
        rows     : "25px 25px 100% 40px 80px",
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
                            stop_button
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
            ,
            plane.narration_box
        ]
    });

    return root;    
}

export function makePlayGrid(plane : plane_ts.Plane, play_button : Button, stop_button : Button, show_contents_button : Button) : layout_ts.Grid {
    let content_grid : layout_ts.Grid;
    if(window.innerHeight < window.innerWidth ){
        content_grid = $grid({
            rows : "100% 80px",
            children : [
                $grid({
                    columns  : "50% 50%",

                    children : [
                        plane.text_block
                        ,
                        plane.canvas_block
                    ]        
                })
                ,
                plane.narration_box
            ]
        })
    }
    else{

        content_grid = $grid({
            rows  : "50% 50% 40px",

            children : [
                plane.canvas_block
                ,
                plane.text_block
                ,
                plane.narration_box
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
                    stop_button
                    ,
                    show_contents_button
                    ,
                    $button({
                        text : "log",
                        click : async (ev:MouseEvent)=>{
                            layout_ts.Log.show(ev);
                        }
                    })
                    ,
                    $button({
                        text : "play all",
                        click : async (ev:MouseEvent)=>{
                            await playAll();
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