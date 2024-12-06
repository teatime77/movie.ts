namespace movie_ts {
//
export const ImgDiv = layout_ts.ImgDiv;
export type ImgDiv = layout_ts.ImgDiv;
export type Attr = layout_ts.Attr;

export const $imgdiv = layout_ts.$imgdiv;
export const $textarea = layout_ts.$textarea;

let root : layout_ts.Grid;
let thumbnails : layout_ts.Flex;
let thumbnails_content : layout_ts.Grid;
let slide_ui : layout_ts.Flex;
let quiz_ui : layout_ts.Grid;

class Slide {
    imgDiv : ImgDiv;

    constructor(imgDiv : ImgDiv){
        this.imgDiv = imgDiv;
    }
}

class Quiz {
    question : string;
    choices : string[];
    explanation : string;

    constructor( data : { question : string, choices : string[], explanation : string }){
        this.question = data.question;
        this.choices = data.choices;
        this.explanation = data.explanation;
    }
}

class Lesson {
    slide_quiz_list : (Slide | Quiz)[] = [];
}

async function addSlide(){
    assert(thumbnails_content.children.length == 2);

    thumbnails_content.children.pop();

    (slide_ui.$("slide-img") as ImgDiv).clearImg();
    (slide_ui.$("slide-text") as TextArea).setValue("");

    thumbnails_content.addChild(slide_ui);
    root.updateRootLayout();
}

async function addQuiz(){
    assert(thumbnails_content.children.length == 2);

    thumbnails_content.children.pop();

    for(const id of [ "quiz-question", "quiz-choices", "quiz-explanation" ]){
        (quiz_ui.$(id) as TextArea).setValue("");
    }

    thumbnails_content.addChild(quiz_ui);
    root.updateRootLayout();
}

async function onFileDrop(file : File){
    const path = await firebase_ts.uploadImgFile(file);

    const img = layout_ts.$img({
        imgUrl : path,
        file   : file,
        width : "100px",
        height : "100px",
    });

    thumbnails.addChild(img);

    root.updateRootLayout();

    return path;
}

export function makeLessonGrid(play_buttons : Flex, button_size : number) : layout_ts.Grid {
    thumbnails =$flex({
        children : [
        ]
    });

    slide_ui = $flex({
        children : [
            $imgdiv({
                id : "slide-img",
                width  : "300px",
                height : "300px",
                backgroundColor : "cornsilk",
                uploadImgFile : onFileDrop
            })       
            ,
            $textarea({
                id : "slide-text",
                cols : 80,
                rows : 30
            })                     
        ]
    });

    quiz_ui = $grid({
        columns : "100px 100%",
        children : [
            $label({ text : "question"}),
            $textarea({
                id : "quiz-question",
                cols : 80,
                rows : 5,
            }),

            $label({ text : "choices"}),
            $textarea({
                id : "quiz-choices",
                cols : 80,
                rows : 5,
                placeholder : 
`1st choice. This choice should be the correct answer.
                
2nd choice. Each choice must be separated by a blank line.

3rd choice. There is no limit to the number of choices.`
            }),

            $label({ text : "explanation"}),
            $textarea({
                id : "quiz-explanation",
                cols : 80,
                rows : 5,
            }),

        ]
    })

    thumbnails_content = $grid({
        id : "thumbnails-content",
        columns : "100px 100%",
        children : [
            thumbnails,
            $label({ text : ""})
        ]
    })
    
    root = $grid({
        rows : `auto 100% ${button_size}px`,
        children : [        
            $flex({
                children : [
                    $button({
                        text : "add slide",
                        fontSize : "xxx-large",
                        click : addSlide
                    })
                    ,
                    $button({
                        text : "add quiz",
                        fontSize : "xxx-large",
                        click : addQuiz
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

        default:
        throw new MyError();
    }
}
}