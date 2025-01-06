namespace movie_ts {
//

export const $flex = layout_ts.$flex;
export const $grid = layout_ts.$grid;
export const $button = layout_ts.$button;
export const $label = layout_ts.$label;

export type Flex = layout_ts.Flex;
export type TextArea = layout_ts.TextArea;

let isVoiceLang : boolean;

export function makeEditGrid(plane : plane_ts.Plane, play_buttons : Flex, button_size : number) : layout_ts.Grid {
    const margin = 10;
    const canvas_narration_height = window.innerHeight - margin - 25 - button_size;
    const canvas_size = Math.min(window.innerWidth, 0.5 * (canvas_narration_height));

    const root = $grid({
        id : "edit-root",
        rows     : `25px ${canvas_narration_height}px ${button_size}px`,
        children:[
            $grid({
                columns  : "50% 50%",
                children: [
                    plane.menu_block
                    ,
                    $flex({
                        children : [
                            // $button({
                            //     text : "create doc",
                            //     click : async (ev:MouseEvent)=>{
                            //         createDoc();
                            //     }
                            // })
                            // ,
                            $button({
                                text : "update doc",
                                click : async (ev:MouseEvent)=>{
                                    // updateDoc();
                                    await updateGraphDoc();
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
                                text : "edit contents",
                                click : async (ev:MouseEvent)=>{
                                    await firebase_ts.showContents(undefined, undefined);
                                }
                            })
                            ,
                            $button({
                                text : "Back up",
                                click : async (ev:MouseEvent)=>{
                                    if(confirm(TT("Do you want to start the backup?"))){

                                        await firebase_ts.BackUp();
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
                            ,
                            $button({
                                text : "copy all",
                                click : async (ev:MouseEvent)=>{
                                    await copyAll();
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

export function makePlayGrid(plane : plane_ts.Plane, play_buttons : Flex, button_size : number) : layout_ts.Grid {
    let content_grid : layout_ts.Grid;
    const horizontal = false;
    const margin = 40;
    const canvas_size = Math.min(window.innerWidth, 0.5 * (window.innerHeight - margin - button_size));

    if(horizontal){
        content_grid = $grid({
            children : [
                $grid({
                    columns  : `${canvas_size}px 100%`,

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
            columns  : `${canvas_size}px`,
            rows  : `${canvas_size}px 100%`,
            children : [
                plane.canvas_block
                ,
                plane.narration_box
            ]
        })
    }
    
    const root = $grid({
        width : `${canvas_size}px`,
        rows     : `${window.innerHeight - margin - button_size}px ${button_size}px`,
        children:[
            $grid({
                columns : `${window.innerWidth}px`,
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

export function showLangDlg(is_voice_lang : boolean){
    isVoiceLang = is_voice_lang;
    $dlg("lang-dlg").showModal();
}

export function langButtonClicked(ev:MouseEvent){
    const button = ev.target as HTMLButtonElement;
    const code3 = button.value;
    msg(`lang:${code3}`);
    if(isVoiceLang){
        voiceLanguageCode = code3;
        setCookie("VoiceLanguage", code3);
    }
    else{
        i18n_ts.setTextLanguageCode(code3)
        i18n_ts.loadTranslationMap();

        setCookie("TextLanguage", code3);
    }
    $dlg("lang-dlg").close();
}

export function setCookie(name : string, value : string) {
    var expires = "";
    var date = new Date();
    // Set the expiration date to 20 years from now
    date.setTime(date.getTime() + (20 * 365 * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Function to get a cookie value by name
export function getCookie(name : string) : string | undefined {
    var nameEQ = name + "=";
    var cookiesArray = document.cookie.split(';');
    for (var i = 0; i < cookiesArray.length; i++) {
        var cookie = cookiesArray[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) == 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }

    return undefined;
}


}