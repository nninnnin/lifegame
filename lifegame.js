var state = Object.create(null)
var view = Object.create(null)
var controls = Object.create(null)

window.onload = functon(){
    readFile("./patterns.json", function(jsonObj,error){
        if(error){//파일을 읽을 수 없으면 패턴 메뉴를 생성하지 않는다.
            delete controls.pattern;
        }else{//파일 읽기에 성공하면 가져온 패턴을 state.patterns에 저장한다.
            state.patterns = jsonObj;
        }
        //body element안에 생명 게임의 각 부품(controls, view)를 생성해서 배치한다
        createLifeGame(document.body,78,60,780,600);
    });
};

function readFile(filename, callback){//filename파일을 XMLHttpRequest 객체로 읽어들입니다. 파일 내용을 JSON객체로 만들어 callback 함수에 인수로 넘깁니다!
    var req=new XMLHttpRequest();
    req.onreadystatechange=function(){
        if(req.readyState==4){
            if(req.status==200){
                callback(req.response, false/* no error */);
            }
            else{
                callback(null, true/* error */);
            }
        }
    };
    req.open("GET",filename,true);
    req.responseType="json";
    req.send(null);
}

//생명 게임 시뮬레이터를 생성하는 함수를 정의
function createLifeGame(parent, nx, ny, width, height){
    //타이틀
    var title = elt("h1",{ class: "title" },"Life Game");
    //view 객체를 생성한다(반환값은 뷰 패널)
    var viewpanel = view.create(nx,ny,width,height);
    //state 객체를 초기화한다
    state.create(nx,ny);
    //controls 객체에서 toolbar 요소를 생성한다
    var toolbar = elt("div",{class:"toolbar"});
    for(let name in controls){
        toolbar.appedChild(controls[name](state));
    }
    //toolbar 요소와 viewpanel요소를 지정한 요소(parent)의 자식 요소로 삽입한다
    parent.appendChild(elt("div",null,title,toolbar,viewpanel));
}

//state객체의 정의
state.create = function(nx,ny){
    //격자의 크기
    state.nx=nx;
    state.ny=ny;
    //셀의 상태를 저장하는 2차원 배열을 생성하고 초기화한다.
    state.cells = new Array(ny);
    
    }
}