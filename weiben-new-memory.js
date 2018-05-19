
class UIUpdate {
    constructor(container) {
        this.container = document.querySelector(container);
    }

    initCardBoard(imageArray) {
        // Double up as we need pairs
        let arrayLength = imageArray.length;
        for(let i = 0; i < arrayLength; i++) {
            imageArray.push(imageArray[i]);
        }
        // Shuffle the images
        imageArray.sort(() => Math.random() - 0.5);

        document.querySelector('.fileselect').remove();
        for (let i = 0; i < imageArray.length; i++) {
            let cardContainer = createUIElement('div', ['cardcontainer', 'col-md-3'], [['style', 'position:relative; top:0; left:0']]);
            createUIElement('img', [`${imageArray[i].pair}`], [['src', imageArray[i].img], ['style', 'position:relative; top:0; left:0']], cardContainer);
            createUIElement('img', [`${imageArray[i].pair}`], [['src', 'img/sw_card_back.jpg'], ['style', 'position:absolute; top:0; left:0;padding-right:20px !important; transition: all .5s']], cardContainer);
            this.container.appendChild(cardContainer);
        }

        this.container.addEventListener('click', (e) => {gameState.imgClick(e)});
    }

    fadeOutCard(card) {
        card.style.opacity = 0;
    }

    fadeInCard(card) {

    }
}

class GameState {
    constructor() {
        this.clickedCard = "";
        this.activeCard = "";
        this.pairShowTime = 1; // How long should the cards be shown before turning back
        this.turn = 0;
		//this._pairCount = this._cardWrapper.children().length / 2;
		this.clickable = true;
    }

    imgClick(e) {
        uiUpdate.fadeOutCard(e.target);
        this.clickedCard = e.target.className;
        console.log(e.target.className);
        if(this.turn === 2) {
            // We have a mathing pair
            if (this.clickedCard === this.activeCard) {
                this.activeCard = "";
                this.turn = 1;
                console.log('Matching pair!');
            } else {
                // Fade up cardback here
            }
        } else {
            this.activeCard = this.clickedCard;
            this.turn = 2;
        }

        this.clickedCard = e.target.className;
    }
}

class SelectImages {
    constructor(container) {
        this.imageArray = [];
        this.container = document.querySelector(container);
    }

    makeSelectButton () {
        let inputBtn =  createUIElement('input',['fileselect'], [['type', 'file'], ['multiple', 'true']],
        this.container, true, 'change', (e) => this.selectedImages(e));
    }

    selectedImages(e) {
        let files = e.target.files;
        if (files && files[0]) {
            for (let i = 0; i < files.length; i++) {
                if (!files[i].type.startsWith('image/')) continue; // If not an image skip this iteration.
                    this.imageArray[i] = this.imagesToArray(files[i], i);
            }
            Promise.all(this.imageArray).then( values => {
                uiUpdate.initCardBoard(values); // Send the images to the class that draws the cardboard
            });
        }
    }

    imagesToArray(file, count) {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.addEventListener("loadend", (e) => {
                resolve({img: e.target.result, pair: `pair${count}`});
            });
            reader.onerror = error => reject(error);
        });
    }

    get imgArray() {
        return this.imageArray;
    }
}

// Helper functions
function createUIElement(type, classNames, attributes, container, eventlistener, eventtype, eventcallback) {
    let element = document.createElement(type);
    if (classNames) {
        for (let cls of classNames) {
            element.classList.add(cls);
        }
    }
    if (attributes) {
        for (attr of attributes) {
            element.setAttribute(attr[0], attr[1]);
        }
    }
    if (eventlistener) {
        element.addEventListener(eventtype, eventcallback);
    }
    if (container) {
        container.appendChild(element);
    } else {
        return element;
    }
}

// Start the game here
let uiUpdate = new UIUpdate('.cards');
let gameState = new GameState();

let imageSelect = new SelectImages('.memory');
imageSelect.makeSelectButton();

