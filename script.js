window.addEventListener("load", () => {
    
    const baseUrl = (window.location.href.substring(0, window.location.href.lastIndexOf("/")))+'/';
    
    //INITIALIZE
    var result = [];
    list.forEach(element => {
        result.push({item: element});
    });
    
    var model = {
        query: '',
        result: result,
        index: -1,
        total: result.length,
        worker: new Worker(importLocalScripts(workerScript.toString())+'#?p='+baseUrl)
    }
    var view = {
        search: document.querySelector('#search>textarea'),
        counter: document.querySelector('#counter'),
        question: document.querySelector('#question>textarea'),
        answer: document.querySelector('#answer>textarea')
    }
    
    reset(model, view);
    
    //SET LISTENERS
    model.worker.addEventListener('message', event => {
        model.index = 0;
        model.result = event.data;
        renderResult(model, view);
    });
    
    view.search.addEventListener("keypress", (event) => {     
        var code = (event.keyCode ? event.keyCode : e.which);
        if(code == 13) { 
            event.preventDefault();
            doSearch(model, view);
        }
    });
    
    view.search.addEventListener('keydown', (event) => {
        const key = event.key;
        if (key === "Delete") {
            event.preventDefault();
            reset(model, view);
        }
        if (key === "ArrowUp") {
            event.preventDefault();
            getPrevious(model, view);
        }
        if (key === "ArrowDown") {
            event.preventDefault();
            getNext(model, view);
        }
    });
    
    //FUNCTIONS
    async function doSearch(model, view) {
        view.counter.innerText = 'Loading...'
        model.worker.postMessage(view.search.value);
    }
    
    async function getNext(model, view) {        
        return new Promise((resolve, reject) => {
            window.setTimeout(() => {
                var i = model.index + 1;
                if(model.result.length > i){
                    model.index = i;
                    renderResult(model, view);
                }
                resolve();
            }, 0, model, view);
        });
    }
    
    async function getPrevious(model, view) {        
        return new Promise((resolve, reject) => {
            window.setTimeout(() => {
                var i = model.index - 1;
                if(i >= 0){
                    model.index = i;
                    renderResult(model, view);
                }
                resolve();
            }, 0, model, view);
        });
    }
    
    function renderResult(model, view){
        if (model.result.length > 0) {
            view.question.value = model.result[model.index].item.question;
            view.answer.value = model.result[model.index].item.answer;
        } else {
            view.question.value = '';
            view.answer.value = '';
        }
        setCounter(model, view);
    }
    
    function reset(model, view){
        model.query = '';
        model.result = result;
        model.index = -1;
        setCounter(model, view);
        view.search.value = '';
        view.question.value = '';
        view.answer.value = '';   
        view.search.focus();
    }
    
    function setCounter(model, view){
        view.counter.innerText = (model.index + 1) + '/' + (model.result.length > 0 ? model.result.length : model.total);
    }
    
    //WORKER
    function importLocalScripts(string){
        return URL.createObjectURL(new Blob(["(" + string + ")()"], { type: 'text/javascript' }));
    }
    function workerScript(){
        const baseUrl = new URL(self.location.toString().replace("#?", "?")).searchParams.get('p');
        self.importScripts(baseUrl+'data.js');
        self.importScripts(baseUrl+'fuse.js');
        
        const options = {
            // isCaseSensitive: false,
            // includeScore: false,
            // shouldSort: true,
            // includeMatches: false,
            // findAllMatches: false,
            minMatchCharLength: 3,
            // location: 0,
            threshold: 0.5,
            // distance: 100,
            // useExtendedSearch: false,
            ignoreLocation: true,
            // ignoreFieldNorm: false,
            // fieldNormWeight: 1,
            keys: [
                "question"
            ]
        };
        
        const fuse = new Fuse(list, options);
        
        self.addEventListener('message', event => {
            self.postMessage(fuse.search(event.data));
        });
    }
    
});
