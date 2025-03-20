namespace movie_ts {
//
export const $flex = layout_ts.$flex;
export const $grid = layout_ts.$grid;
export const $button = layout_ts.$button;
export const $label = layout_ts.$label;

export type Flex = layout_ts.Flex;
export type TextArea = layout_ts.TextArea;

export type  Widget = plane_ts.Widget;
export const Widget = plane_ts.Widget;

export type Img = layout_ts.Img;
export type Grid = layout_ts.Grid;
export type TextBox = layout_ts.TextBox;

export const ImgDiv = layout_ts.ImgDiv;
export type ImgDiv = layout_ts.ImgDiv;
export type Attr = layout_ts.Attr;

export const $img = layout_ts.$img;
export const $textbox = layout_ts.$textbox;
export const $imgdiv = layout_ts.$imgdiv;
export const $textarea = layout_ts.$textarea;
export const $input_range = layout_ts.$input_range;

export const setPlayMode = i18n_ts.setPlayMode;
export const getPlayMode = i18n_ts.getPlayMode;
export const sleep = i18n_ts.sleep;
export const last = i18n_ts.last;

export type  Speech = i18n_ts.Speech;
export const Speech = i18n_ts.Speech;

export const cancelSpeech = i18n_ts.cancelSpeech;
export const setVoiceLanguageCode = i18n_ts.setVoiceLanguageCode;

const $dic = new Map<string, HTMLElement>();


export function $(id : string) : HTMLElement {
    let ele = $dic.get(id);
    if(ele == undefined){
        ele = document.getElementById(id)!;
        if(ele == undefined){
            ele = root.getElementById(id)!;
        }
        $dic.set(id, ele);
    }

    return ele;
}

export function $div(id : string) : HTMLDivElement {
    return $(id) as HTMLDivElement;
}

export function $dlg(id : string) : HTMLDialogElement {
    return $(id) as HTMLDialogElement;
}

export function $sel(id : string) : HTMLSelectElement {
    return $(id) as HTMLSelectElement;
}


export class MyError extends Error {
    constructor(text : string = ""){
        super(text);
    }
}

export function assert(b : boolean, msg : string = ""){
    if(!b){
        throw new MyError(msg);
    }
}    

export function msg(txt : string){
    layout_ts.Log.log(txt);
}

export function range(n: number) : number[]{
    return [...Array(n).keys()];
}

export async function fetchText(fileURL: string) {
    const response = await fetch(fileURL);
    const text = await response!.text();

    return text;
}

export async function includeDialog(url : string){
    const dialog_html = await fetchText(url);

    const div = document.createElement("div");
    div.innerHTML = dialog_html;
    document.body.append(div);
}

}