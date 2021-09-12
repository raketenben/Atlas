"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var marked_1 = __importDefault(require("marked"));
var dompurify_1 = __importDefault(require("dompurify"));
var highlight_js_1 = __importDefault(require("highlight.js"));
var NavDrawer = (function () {
    function NavDrawer(_element, _args) {
        var _this_1 = this;
        this.state = false;
        this.element = _element;
        this.xDirection = _args.direction == "left" ? 1 : -1;
        this.target = _args.target;
        this.sectorStart = _args.sectorStart;
        this.sectorEnd = _args.sectorEnd;
        document.addEventListener('touchstart', function (evt) {
            _this_1.handleTouchStart(evt);
        }, false);
        document.addEventListener('touchmove', function (evt) {
            _this_1.handleTouchMove(evt);
        }, false);
        document.addEventListener('touchend', function (evt) {
            _this_1.handleTouchEnd(evt);
        }, false);
        this.xDown = null;
        this.yDown = null;
    }
    NavDrawer.prototype.getTouches = function (evt) {
        return evt.touches;
    };
    NavDrawer.prototype.handleTouchStart = function (evt) {
        var firstTouch = this.getTouches(evt)[0];
        var windowWidth = window.innerWidth;
        var containerStart = windowWidth * this.sectorStart;
        var containerEnd = windowWidth * this.sectorEnd;
        if ((containerStart < firstTouch.clientX && firstTouch.clientX < containerEnd) || this.state) {
            this.xDown = firstTouch.clientX;
            this.yDown = firstTouch.clientY;
        }
    };
    NavDrawer.prototype.handleTouchMove = function (evt) {
        if (!this.xDown || !this.yDown)
            return;
        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;
        this.xDiff = (this.xDown - xUp) * this.xDirection;
        this.yDiff = (this.yDown - yUp);
        if (Math.abs(this.xDiff) > Math.abs(this.yDiff)) {
            var d = Math.min(Math.max(1 - this.xDiff / this.element.offsetWidth, 0), 1);
            this.updateElement(d);
        }
    };
    ;
    NavDrawer.prototype.handleTouchEnd = function (evt) {
        if (Math.abs(this.xDiff) > Math.abs(this.yDiff)) {
            if (this.xDiff > this.element.offsetWidth * 0.5) {
                this.updateElement(0);
                this.state = true;
            }
            else {
                this.updateElement(1);
                this.state = false;
            }
        }
        this.xDown = null;
        this.yDown = null;
    };
    NavDrawer.prototype.updateElement = function (d) {
        this.element.style.setProperty("transform", "translateX(" + this.target * d + "%)");
    };
    return NavDrawer;
}());
var statusContent = (function () {
    function statusContent() {
    }
    statusContent.loadingLogo = function () {
        var loadingImage = document.createElement("img");
        loadingImage.setAttribute("src", "https://static.caesi.dev/images/icons/logo-loading.svg");
        loadingImage.classList.add("logo");
        loadingImage.classList.add("status");
        return loadingImage;
    };
    statusContent.custom = function (content) {
        var loadingText = document.createElement("p");
        loadingText.innerHTML = content;
        loadingText.classList.add("status");
        return loadingText;
    };
    return statusContent;
}());
var Utility = (function () {
    function Utility() {
    }
    Utility.combinePaths = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var split = args.map(function (value) { return value.split("/"); });
        var flatten = split.flat(Infinity);
        var filtered = flatten.filter(function (value) { return (value != ""); });
        for (var x = 0; x < filtered.length; x++) {
            if (filtered[x] == "..")
                filtered.splice(x - 1, 2);
        }
        return filtered.join('/');
    };
    return Utility;
}());
var Explorer = (function () {
    function Explorer(_element, _function) {
        this.explorerPath = "";
        this.element = _element;
        this.fileClickEvent = _function;
        this.fill();
    }
    Explorer.prototype.createFileLink = function (filename, customName) {
        var _this_1 = this;
        var fileLink = document.createElement("a");
        var displayName = filename.includes(".") ? filename.split(".").slice(0, -1).join(".") : filename;
        fileLink.innerHTML = customName ? customName : displayName;
        fileLink.addEventListener("click", function () {
            var filePath = Utility.combinePaths(_this_1.explorerPath, displayName);
            history.pushState(null, null, "/read/" + Utility.combinePaths(_this_1.explorerPath, displayName));
            _this_1.fileClickEvent(filePath);
        });
        return fileLink;
    };
    Explorer.prototype.createFolderLink = function (filename, customName) {
        var _this_1 = this;
        var folderLink = document.createElement("a");
        folderLink.innerHTML = customName ? customName : filename;
        folderLink.addEventListener("click", function () {
            _this_1.explorerPath = Utility.combinePaths(_this_1.explorerPath, filename);
            _this_1.fill();
        });
        return folderLink;
    };
    Explorer.prototype.fill = function () {
        var _this_1 = this;
        this.element.innerHTML = "";
        var explorerPath = "/" + Utility.combinePaths("articles", this.explorerPath);
        fetch(explorerPath)
            .then(function (res) { return res.json(); })
            .then(function (data) {
            if (_this_1.explorerPath != '') {
                var link = _this_1.createFolderLink("..", "Zurück");
                _this_1.element.appendChild(link);
            }
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var entry = data_1[_i];
                if (entry.isDirectory) {
                    var link = _this_1.createFolderLink(entry.name, null);
                    _this_1.element.appendChild(link);
                }
                else {
                    var link = _this_1.createFileLink(entry.name, null);
                    _this_1.element.appendChild(link);
                }
            }
        });
    };
    return Explorer;
}());
var Page = (function () {
    function Page(_element, _contents, _explorer) {
        this.startDocument = "start";
        var _this = this;
        this.element = _element;
        this.contents = new TableOfContents(_contents);
        this.explorer = new Explorer(_explorer, function (path) {
            _this.showDocument(path);
        });
        this.showDocument(this.getTargetPath());
    }
    Page.prototype.getTargetPath = function () {
        return window.location.pathname.split("/").splice(2, Infinity).join('/');
    };
    Page.prototype.showDocument = function (path) {
        var _this_1 = this;
        if (!Utility.combinePaths(path))
            path = this.startDocument;
        var articlePath = "/" + Utility.combinePaths("articles", path) + ".md";
        this.element.innerHTML = "";
        this.element.appendChild(statusContent.loadingLogo());
        this.element.appendChild(statusContent.custom("Lade..."));
        fetch(articlePath)
            .then(function (res) {
            _this_1.element.innerHTML = "";
            switch (res.status) {
                case 200:
                    res.text().then(function (article) {
                        _this_1.putArticle(article);
                    });
                    break;
                case 404:
                    _this_1.element.appendChild(statusContent.custom("Artikel nicht gefunden."));
                    break;
                default:
                    _this_1.element.appendChild(statusContent.custom("Ein unbekannter Fehler ist aufgetreten."));
                    break;
            }
        }, function (err) {
            this.element.innerHTML = "";
            this.element.appendChild(statusContent.custom("Anfrage fehlgschlagen."));
        });
    };
    Page.prototype.putArticle = function (content) {
        var menueHeader = [];
        var walkTokens = function (token) {
            if (token.type === 'heading') {
                var tokenId = token.text.toLowerCase().replace(" ", "-");
                menueHeader.push({ id: tokenId, text: token.text, depth: token.depth });
            }
        };
        marked_1["default"].use({ walkTokens: walkTokens });
        marked_1["default"].setOptions({
            highlight: function (code, lang) {
                if (lang) {
                    return highlight_js_1["default"].highlight(code, { language: lang }).value;
                }
                else {
                    return highlight_js_1["default"].highlightAuto(code).value;
                }
            }
        });
        var output = dompurify_1["default"].sanitize(marked_1["default"](content));
        this.element.innerHTML = output;
        this.contents.fill(menueHeader);
    };
    return Page;
}());
var TableOfContents = (function () {
    function TableOfContents(_element) {
        this.element = _element;
    }
    TableOfContents.prototype.createSubsection = function (pTree) {
        var section = document.createElement("div");
        section.classList.add("subsections");
        pTree[pTree.length - 1].appendChild(section);
        pTree.push(section);
    };
    TableOfContents.prototype.addEntry = function (pTree, data) {
        var entry = document.createElement("a");
        entry.setAttribute("href", "#" + data.id);
        entry.innerHTML = data.text;
        pTree[pTree.length - 1].appendChild(entry);
    };
    TableOfContents.prototype.fill = function (content) {
        console.log(content);
        this.element.innerHTML = "";
        var pTree = [this.element];
        var indexOfLastHTMLElement = content.length - 1;
        console.log(content);
        for (var i = 0; i < indexOfLastHTMLElement; i++) {
            var currentHTMLElement = content[i];
            var nextHTMLElement = content[i + 1];
            var difference = Math.abs(nextHTMLElement.depth - currentHTMLElement.depth);
            console.log(currentHTMLElement.depth, nextHTMLElement.depth, difference);
            for (var i_1 = 0; i_1 < difference; i_1++) {
                if (currentHTMLElement.depth < nextHTMLElement.depth) {
                    this.createSubsection(pTree);
                }
                if (currentHTMLElement.depth > nextHTMLElement.depth)
                    pTree.splice(-1, 1);
            }
            this.addEntry(pTree, currentHTMLElement);
            console.log(pTree);
        }
        this.addEntry(pTree, content[indexOfLastHTMLElement]);
    };
    return TableOfContents;
}());
new Page(document.getElementById("content"), document.getElementById("tableofcontents"), document.getElementById("explorer"));
new NavDrawer(document.getElementsByTagName("nav")[0], {
    direction: "right",
    target: -100,
    sectorStart: 0,
    sectorEnd: 0.2
});
new NavDrawer(document.getElementsByTagName("aside")[0], {
    direction: "left",
    target: 100,
    sectorStart: 0.8,
    sectorEnd: 1
});
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').then(function (registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
//# sourceMappingURL=index.js.map