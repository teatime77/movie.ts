namespace movie_ts {
//

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


export async function sleep(milliseconds : number) : Promise<void> {
    return new Promise((resolve) => {
        setTimeout(()=>{
            resolve();
        }, milliseconds);
    });
}

}