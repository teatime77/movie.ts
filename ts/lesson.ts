namespace movie_ts {
//
export type  Widget = plane_ts.Widget;
export const Widget = plane_ts.Widget;

export const ImgDiv = layout_ts.ImgDiv;
export type ImgDiv = layout_ts.ImgDiv;
export type Attr = layout_ts.Attr;

export const $imgdiv = layout_ts.$imgdiv;
export const $textarea = layout_ts.$textarea;

export const last = i18n_ts.last;

let root : layout_ts.Grid;
let thumbnails : layout_ts.Grid;
let thumbnails_content : layout_ts.Grid;
let slide_ui : layout_ts.Grid;
let quiz_ui : layout_ts.Grid;
let theLesson : Lesson;
let current : Slide | Quiz | undefined;
let speech : Speech;


class Slide extends Widget {
    static ui = { 
        explanation : $textarea({
            id : "slide-text",
        })
    };

    imgPath : string = "";
    explanation : string = "";
    downloadURL : string = "";

    constructor(data : { imgPath? : string, explanation? : string }){
        super(data);
        if(data.imgPath != undefined){

            this.imgPath = data.imgPath;
        }

        if(data.explanation != undefined){

            this.explanation = data.explanation;
        }
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            imgPath     : this.imgPath,
            explanation : this.explanation
        });

        return obj;
    }

    async getDownloadURL(){
        let url = this.imgPath;
        if(url.startsWith("users/")){
            
            url = await firebase_ts.getStorageDownloadURL(url);
        }

        return url;
    }

    async addThumbnail(file? : File){
        this.downloadURL = await this.getDownloadURL();

        const img = layout_ts.$img({
            imgUrl : this.downloadURL,
            file   : file,
            width : "100px",
            height : "100px",
            click : async (ev : MouseEvent)=>{
                updateDataByUI();
                current = this;
                this.show();
            }
        });
    
        thumbnails.addChild(img);    
    }

    show(){
        setEditUI(slide_ui);

        (slide_ui.$("slide-img") as ImgDiv).setImgUrl(this.downloadURL);
        Slide.ui.explanation.setValue(this.explanation);

        root.updateRootLayout();
    }

    async play(speech : Speech){
        setEditUI(slide_ui);
        (slide_ui.$("slide-img") as ImgDiv).setImgUrl(this.downloadURL);
        Slide.ui.explanation.setValue("");
        root.updateRootLayout();

        const font_size = Slide.ui.explanation.html().style.fontSize;
        Slide.ui.explanation.html().style.fontSize = "xxx-large";

        const lines = this.explanation.split("\n").map(x => x.trim()).filter(x => x != "");
        for(const line of lines){
            if(stopPlayFlag){
                msg("break lines by flag");
                break;
            }
    
            Slide.ui.explanation.setValue(TT(line));
            await speech.speak_waitEnd(TT(line));
        }

        Slide.ui.explanation.html().style.fontSize = font_size;
    }
}

class Quiz extends Widget {
    static ui = {
        question : $textarea({
            cols : 80,
            rows : 5,
        })
        ,
        choices : $textarea({
            cols : 80,
            rows : 5,
            placeholder : 
`1st choice. This choice should be the correct answer.
            
2nd choice. Each choice must be separated by a blank line.

3rd choice. There is no limit to the number of choices.`
        })
        ,
        commentary : $textarea({
            cols : 80,
            rows : 5,
        })

    };

    question : string;
    choices : string[];
    commentary : string;

    constructor( data : { question : string, choices : string[], commentary : string }){
        super(data);
        this.question   = data.question;
        this.choices    = data.choices;
        this.commentary = data.commentary;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            question   : this.question,
            choices    : this.choices,
            commentary : this.commentary
        });

        return obj;
    }

    async addThumbnail(){
        const img = layout_ts.$img({
            imgUrl : `${urlOrigin}/lib/movie/img/quiz.png`,
            width : "100px",
            height : "100px",
            click : async (ev : MouseEvent)=>{
                updateDataByUI();
                current = this;
                this.show();
            }
        });
    
        thumbnails.addChild(img);    
    }

    show(){
        setEditUI(quiz_ui)

        Quiz.ui.question.setValue(this.question);
        Quiz.ui.choices.setValue(this.commentary);
        Quiz.ui.commentary.setValue(this.commentary);

        root.updateRootLayout();
    }

    async play(speech : Speech){
        this.show();
    }
}

class Lesson extends Widget {
    materials : (Slide | Quiz)[] = [];

    constructor(data : { materials : (Slide | Quiz)[] }){
        super(data);

        this.materials = data.materials;
    }

    makeObj() : any {
        let obj = Object.assign(super.makeObj(), {
            materials : this.materials.map(x => x.makeObj())
        });

        return obj;
    }

    show(){
        this.materials.forEach(x => x.show());
    }
}

function getTextsFromNewlineDelimitedString(str : string) : string[] {
    const texts : string[] = [];

    let lines = str.replaceAll("\r\n", "\n").split("\n");
    lines = lines.map(x => x.trim());

    let text = "";
    for(const line of lines){
        if(line == ""){
            if(text != ""){
                texts.push(text);
                text = "";
            }

            continue;
        }

        if(text == ""){
            text = line;
        }
        else{
            text += "\n" + line;
        }
    }

    if(text != ""){
        texts.push(text);
    }

    return texts;
}

function updateDataByUI(){
    if(current instanceof Slide){
        current.explanation = Slide.ui.explanation.getValue();
    }
    else if(current instanceof Quiz){
        current.question   = Quiz.ui.question.getValue();
        current.choices   = getTextsFromNewlineDelimitedString( Quiz.ui.choices.getValue() );
        current.commentary = Quiz.ui.commentary.getValue();
    }
}

function setEditUI(ui : layout_ts.UI){
    assert(thumbnails_content.children.length == 2);

    thumbnails_content.popChild();
    thumbnails_content.addChild(ui);
}

async function addSlide(){
    updateDataByUI();

    current = new Slide({});
    theLesson.materials.push( current );

    setEditUI(slide_ui);

    (slide_ui.$("slide-img") as ImgDiv).clearImg();
    Slide.ui.explanation.setValue(current.explanation);

    root.updateRootLayout();
}

async function addQuiz(){
    updateDataByUI();

    setEditUI(quiz_ui)

    Quiz.ui.question.setValue("");
    Quiz.ui.choices.setValue("");
    Quiz.ui.commentary.setValue("");

    current = new Quiz({
        question : "",
        choices : [],
        commentary : ""
    });

    theLesson.materials.push(current);

    await current.addThumbnail();

    root.updateRootLayout();
}

async function newLesson() {
    const data = theLesson.makeObj();
    const doc_text = JSON.stringify(data, null, 4);

    firebase_ts.showContents(undefined, doc_text);
}

async function updateLesson() {
    updateDataByUI();
    
    if(theDoc == undefined){
        alert("no document");
        return;
    }

    const data = theLesson.makeObj();
    theDoc.text = JSON.stringify(data, null, 4);
    await theDoc.updateDocDB();
}

async function onFileDrop(file : File){
    const path = await firebase_ts.uploadImgFile(file);

    if(current instanceof Slide){
        current.imgPath = path;
        await current.addThumbnail(file);
    }
    else{
        throw new MyError();
    }

    root.updateRootLayout();

    return path;
}

export function makeLessonGrid(play_buttons : Flex, button_size : number) : layout_ts.Grid {
    thumbnails =$grid({
        columns : "100px",
        children : [
        ]
    });

    slide_ui = $grid({
        id : "slide-ui",
        rows : "50% 50%",
        children : [
            $imgdiv({
                id : "slide-img",
                backgroundColor : "cornsilk",
                uploadImgFile : onFileDrop
            })       
            ,
            Slide.ui.explanation
        ]
    });

    quiz_ui = $grid({
        id : "quiz-ui",
        columns : "100px 100%",
        rows    : "300px 100% 300px",
        children : [
            $label({ text : "question"})
            ,
            Quiz.ui.question
            ,
            $label({ text : "choices"})
            ,
            Quiz.ui.choices
            ,
            $label({ text : "explanation"})
            ,
            Quiz.ui.commentary
        ]
    })

    thumbnails_content = $grid({
        id : "thumbnails-content",
        columns : "100px 100%",
        children : [
            thumbnails,
            $label({
                text : "",
                width : "300px",
                height : "300px",
                backgroundColor : "cyan",
            })
        ]
    })
    
    root = $grid({
        id : "lesson-root",
        rows : `auto 100% ${button_size}px`,
        columns : "100%",
        children : [        
            $flex({
                children : [
                    $button({
                        text : "add slide",
                        fontSize : "large",
                        click : addSlide
                    })
                    ,
                    $button({
                        text : "add quiz",
                        fontSize : "large",
                        click : addQuiz
                    })
                    ,
                    $button({
                        text : "update doc",
                        fontSize : "large",
                        click : updateLesson
                    })
                    ,
                    $button({
                        text : "new doc",
                        fontSize : "large",
                        click : newLesson
                    })
                ]
            })
            ,
            thumbnails_content            
            ,
            play_buttons
        ]
    });

    return root;
}

function parseLessonObject(obj : any) : any {
    switch(obj.typeName){
    case Slide.name:
        return new Slide(obj);

        case Quiz.name:
        return new Quiz(obj);

        case Lesson.name:
            return new Lesson(obj);

        default:
            throw new MyError();
    }
}


export async function readLesson(id : number) {
    // msg(`id:${id}`);
    theDoc = await firebase_ts.getDoc(id);
    if(theDoc != undefined){

        // msg(`read doc:${theDoc.id} ${theDoc.name}`)
        const obj = JSON.parse(theDoc.text);

        const lesson = plane_ts.parseObject(obj, parseLessonObject);
        if(lesson instanceof Lesson){

            msg("lesson loaded");
            theLesson = lesson;

            for(const material of theLesson.materials){
                await material.addThumbnail();
            }
        }
        else{
            throw new MyError();
        }

        root.updateRootLayout();
    }
}

export async function playLesson(){
    msg("play lesson start");

    Plane.one.playMode = PlayMode.normal;
    stopPlayFlag = false;

    speech = new Speech();

    for(const material of theLesson.materials){
        if(stopPlayFlag){
            msg("stop by flag");
            break;
        }

        await material.play(speech);
    }
    msg("play lesson completes");

    Plane.one.playMode = PlayMode.stop;
}

export async function stopLesson(){
    cancelSpeech();
}

export function initLesson(){
    theLesson = new Lesson({
        materials : []
    });
}
}