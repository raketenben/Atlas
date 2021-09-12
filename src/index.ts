import marked, { Token } from "marked";
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';


class NavDrawer{

    element : HTMLElement;
    target: number;

    sectorStart : number;
    sectorEnd : number;

    state : boolean;

    xDirection : number;

    xDown : number;
    yDown : number;

    xDiff : number;
    yDiff : number;

    constructor(_element : HTMLElement,_args : any){
        this.state = false;

        this.element = _element;
        this.xDirection = _args.direction == "left" ? 1 : -1;
        this.target = _args.target;

        this.sectorStart = _args.sectorStart;
        this.sectorEnd = _args.sectorEnd;

        document.addEventListener('touchstart', (evt) => {
            this.handleTouchStart(evt)
        }, false);        
        document.addEventListener('touchmove', (evt) => {
            this.handleTouchMove(evt)
        }, false);
        document.addEventListener('touchend', (evt) => {
            this.handleTouchEnd(evt)
        }, false);

        this.xDown = null;     
        this.yDown = null;     
    }

    getTouches(evt : TouchEvent) {
        return evt.touches  // browser API
    }                                                     
  
    handleTouchStart(evt : TouchEvent) {
        const firstTouch = this.getTouches(evt)[0];
        let windowWidth = window.innerWidth;
      
        let containerStart = windowWidth * this.sectorStart;
        let containerEnd = windowWidth * this.sectorEnd;


      if((containerStart < firstTouch.clientX && firstTouch.clientX < containerEnd) || this.state){
          
        this.xDown = firstTouch.clientX;
        this.yDown = firstTouch.clientY;
      }
    } 
  
    handleTouchMove(evt : TouchEvent) {
        if (!this.xDown || !this.yDown) return;

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;

        this.xDiff = (this.xDown - xUp) * this.xDirection;
        this.yDiff = (this.yDown - yUp);

        if(Math.abs(this.xDiff) > Math.abs(this.yDiff)){
            let d = Math.min(Math.max(1-this.xDiff/this.element.offsetWidth,0),1);
            this.updateElement(d)
        }

    };

    handleTouchEnd(evt : TouchEvent){
        
        if(Math.abs(this.xDiff) > Math.abs(this.yDiff)){
            if(this.xDiff > this.element.offsetWidth*0.5){
                this.updateElement(0);
                this.state = true;
            }else{
                this.updateElement(1);
                this.state = false;
            }
        }

        this.xDown = null;   
        this.yDown = null; 
    }

    updateElement(d : number){
        this.element.style.setProperty("transform",`translateX(${this.target*d}%)`)
    }
}


type headerData = {
    id: string,
    text: string,
    depth : number
}

class statusContent {
    static loadingLogo(){
        let loadingImage = document.createElement("img");

        loadingImage.setAttribute("src","https://static.caesi.dev/images/icons/logo-loading.svg");

        loadingImage.classList.add("logo");
        loadingImage.classList.add("status");

        return loadingImage;
    }

    static custom(content : string){
        let loadingText = document.createElement("p");
        loadingText.innerHTML = content;
        loadingText.classList.add("status");

        return loadingText;
    }

}

class Utility {
    static combinePaths(...args : Array<string | Array<string>>){
        //seperate parts by slashes
        let split = args.map(function(value : string){ return value.split("/")});
        //colapse all subarrays into main array
        let flatten = split.flat(Infinity);
        //filter empty parts from array
        let filtered = flatten.filter(function(value){return (value != "")})
        //back up on ..
        for (let x = 0; x < filtered.length; x++) {
            if(filtered[x] == "..") filtered.splice(x-1,2)
        }
        //recombine array parts to path
        return filtered.join('/');
    }
}

class Explorer{
    element : HTMLElement;

    explorerPath : string = "";

    fileClickEvent : Function;

    constructor(_element : HTMLElement,_function : Function){
        this.element = _element ;
        this.fileClickEvent = _function;

        //initialize
        this.fill();
    }

    createFileLink(filename : string,customName : string){
        let fileLink = document.createElement("a");
        let displayName =  filename.includes(".") ? filename.split(".").slice(0, -1).join(".") : filename;
        fileLink.innerHTML = customName ? customName : displayName;
        fileLink.addEventListener("click",() => {
            let filePath = Utility.combinePaths(this.explorerPath,displayName);
            history.pushState(null, null, `/read/${Utility.combinePaths(this.explorerPath,displayName)}`)
            this.fileClickEvent(filePath);
        });
        return fileLink;
    }

    createFolderLink(filename : string,customName : string){
        let folderLink = document.createElement("a");
        folderLink.innerHTML = customName ? customName : filename;
        folderLink.addEventListener("click",() => {
            this.explorerPath = Utility.combinePaths(this.explorerPath,filename);
            this.fill();
        });
        return folderLink;
    }

    fill(){
        this.element.innerHTML = "";
        let explorerPath = `/${Utility.combinePaths("articles",this.explorerPath)}`;
        fetch(explorerPath)
        .then((res) => { return res.json() })
        .then((data) => {
            if(this.explorerPath != ''){
                let link = this.createFolderLink("..","Zurück");
                this.element.appendChild(link);
            }
            for (const entry of data) {
                if(entry.isDirectory){
                    let link = this.createFolderLink(entry.name,null);
                    this.element.appendChild(link);
                }else{
                    let link = this.createFileLink(entry.name,null);
                    this.element.appendChild(link);
                }
            }
        })
    }
}

class Page {
    element : HTMLElement;

    contents : TableOfContents;
    explorer : Explorer;

    startDocument : string = "start";

    constructor(_element : HTMLElement,_contents : HTMLElement,_explorer : HTMLElement){
        let _this = this;
        this.element = _element;
        this.contents = new TableOfContents(_contents);
        this.explorer = new Explorer(_explorer,function(path : string){
            _this.showDocument(path)
        });
    
        //Page load
        this.showDocument(this.getTargetPath())
    }

    getTargetPath(){
        return window.location.pathname.split("/").splice(2,Infinity).join('/');
    }

    showDocument(path : string){

        //default to start document
        if(!Utility.combinePaths(path)) path = this.startDocument;
        //get path to requested article
        let articlePath = `/${Utility.combinePaths("articles",path)}.md`;

        //show Loading
        this.element.innerHTML = "";
        this.element.appendChild(statusContent.loadingLogo());
        this.element.appendChild(statusContent.custom("Lade..."));
        
        //fetch document
        fetch(articlePath)
        .then((res) => {
            this.element.innerHTML = "";
            switch(res.status){
                case 200:
                    res.text().then((article) => {
                        this.putArticle(article);
                    });
                    break;
                case 404:
                    this.element.appendChild(statusContent.custom("Artikel nicht gefunden."));
                    break;
                default:
                    this.element.appendChild(statusContent.custom("Ein unbekannter Fehler ist aufgetreten."));
                    break;
            }
        },function(err){
            this.element.innerHTML = "";
            this.element.appendChild(statusContent.custom("Anfrage fehlgschlagen."));
        });
    }

    putArticle(content : string){
        //array to store headers
        let menueHeader : headerData[] = [];

        //Grab all objects of type header and store them
        const walkTokens = (token : Token) => {
            if (token.type === 'heading') {
                let tokenId = token.text.toLowerCase().replace(" ", "-");
                menueHeader.push({ id: tokenId, text: token.text, depth: token.depth });
            }
        };

        //tell markup to use our walkTokens function
        marked.use({ walkTokens });
    
        //add highlighting
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang) {
                    return hljs.highlight(code, { language: lang }).value;
                } else {
                    return hljs.highlightAuto(code).value;
                }
            }
        });

        //generate xml version of markup and sanatize before outputing
        let output = DOMPurify.sanitize(marked(content));
        this.element.innerHTML = output;

        //genearte table of contents
        this.contents.fill(menueHeader);
    }
}


class TableOfContents {
    //root element for table of contents
    element : HTMLElement;

    constructor(_element : HTMLElement){
        this.element = _element;
    }

    createSubsection(pTree : HTMLElement[]) {
        let section = document.createElement("div");
        section.classList.add("subsections");
        pTree[pTree.length - 1].appendChild(section);
        pTree.push(section);
    }

    addEntry(pTree : HTMLElement[],data : headerData){
        let entry = document.createElement("a");
        entry.setAttribute("href", "#" + data.id)
        entry.innerHTML = data.text;
        pTree[pTree.length - 1].appendChild(entry);
    }
    
    fill(content : headerData[]){
        console.log(content)

        //clear List
        this.element.innerHTML = "";

        //declare first Parent in Tree
        let pTree = [this.element];

        let indexOfLastHTMLElement = content.length-1;

        console.log(content)

        //lopp through header
        for (let i = 0; i < indexOfLastHTMLElement; i++) {
            const currentHTMLElement = content[i];
            const nextHTMLElement = content[i+1];


            let difference = Math.abs(nextHTMLElement.depth - currentHTMLElement.depth);
            console.log(currentHTMLElement.depth,nextHTMLElement.depth,difference)

            //add or remove subsection depending on header depth
            for(let i = 0; i < difference; i++){
                if(currentHTMLElement.depth < nextHTMLElement.depth){
                    this.createSubsection(pTree);
                }
                if (currentHTMLElement.depth > nextHTMLElement.depth) 
                    pTree.splice(-1, 1);
            }
            this.addEntry(pTree,currentHTMLElement);

            console.log(pTree)

        }

        //add last HTMLElement
        this.addEntry(pTree,content[indexOfLastHTMLElement]);
    }
}

new Page(
    document.getElementById("content"),
    document.getElementById("tableofcontents"),
    document.getElementById("explorer")
);

new NavDrawer(
    document.getElementsByTagName("nav")[0],{
        direction: "right",
        target: -100,
        sectorStart: 0,
        sectorEnd: 0.2,
    }
);
new NavDrawer(
    document.getElementsByTagName("aside")[0],{
        direction: "left",
        target: 100,
        sectorStart: 0.8,
        sectorEnd: 1,
    }
);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}