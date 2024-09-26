namespace movie_ts {
//

export async function bodyOnLoad(){
    plane_ts.initPlane($div("menu-bar"), $div("shape-tool"), $div("canvas-div"), $div("property-div"));
    
    await includeDialog("./lib/firebase/dialog.html");
    await includeDialog("./lib/movie/dialog.html");

    await asyncInitSpeech();

    firebase_ts.initFirebase();

    $("movie-play").addEventListener("click", (ev : MouseEvent)=>{
        play();
    })

    $("movie-start").addEventListener("click", (ev : MouseEvent)=>{
        startMovie();
    })

    $("movie-show-firebase").addEventListener("click", (ev : MouseEvent)=>{
        $dlg("firebase-menu").showModal();        
    })

}

export function SignUp(){
    $dlg("sign-up").showModal();
}
}