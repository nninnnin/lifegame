var state = Object.create(null)
var view = Object.create(null)
var controls = Object.create(null)

window.onload = function(){
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
        for(var ix=0;ix<nx; ix++){
            state.cells[ix] = new Array(ny);
            for(var iy=0;iy<ny;iy++){
                state.cells[ix][iy]=0;
            }
        }

        //click이벤트 리스너 등록 : view가 발행한 이벤트에 반응하여 셀의 상태를 바꾼다.
        document.addEventListener("clickview",function(event){
            state.setLife(event.detail.ix, event.detail.iy, event.detail.life);
        }, false);

        //changeCell 이벤트 객체와 changeGeneration 이벤트 객체를 생성한다.
        state.changeCellEvent = document.createEvent("HTMLEvents");
        state.changeGenerationEvent = document.createEvent("HTMLEvents");

        //generation를 추가하고 0으로 설정한다
        state.generation = 0;
        state.tellGenerationChange(0);

        //애니메이션의 상태를 저장하는 변수
        state.playing = false; //애니메이션이 실행 중인지를 뜻하는 논리값
        state.timer = null; //애니메이션의 타이머
    }

    state.tellCellChange = function(ix, iy, life){
        state.changeCellEvent.initEvent("changecell",false,false);
        state.changeCellEvent.detail = {ix:ix,iy:iy,life:life};
        document.dispatchEvent(state.changeCellEvent)
    }

    //세대가 바뀔 때 호출되는 메서드 tellGenerationChange 안에서 changegeneration이라는 커스텀 이벤트를 발행합니다.
    //view 객체는 이 changegeneration 이벤트에 반응하여 세대 표시를 갱신합니다.
    state.tellGenerationChange = function(generation){
        state.chagneGenerationEvent.initEvent("changegeneration",false,false);
        state.changeGenerationEvent.detail = {genertaion : generation};
        document.dispatchEvent(state.changeGenerationEvent);
    }

    //셀(ix,iy)주변 생물의 마릿수를 구합니다. 격자의 윗부분과 아랫부분, 왼쪽 부분과 오른쪽 부분이 연결되는 조건인 주기적인 경계 조건에 따라 계산합니다.(뭔소리여..)
    state.getSumAround = function(ix,iy){
        var dx = [0, 1, 1, 1, 0,-1,-1,-1];
        var dy = [1, 1, 0,-1,-1,-1, 0, 1];
        //주기적 경계 조건(.......;;)
        for(var k=0,sum=0;k<dx.length;k++){
            if(state.cells[(ix+dx[k]+state.nx)%state.nx][(iy+dy[k]+state.ny)%state.ny]){
                sum++
            }
        }
    }

    //세대 변화에 따라 생물의 상태를 바꾸는 메서드를 정의
    state.update = function(){
        //상태를 바꾸지 않고 전체 셀을 검사한다. 그리고 변경할 셀을 changedCell 배열에 담는다
        var changedCell = [];
        for(var ix=0; ix<state.nx; ix++){
            for(var iy=0; iy<state.ny; iy++){
                var sum = state.getSumAround(ix,iy);
                if(sum<1 || sume >=4){//주위의 마릿수가 한마리 이하거나 네마리 이상이면 죽는다
                    if(state.cells[ix][iy]){
                        changedCell.push({x:ix,y:iy});
                        //셀의 변경을 요청한다
                        state.tellCellChange(ix,iy,0);
                    }
                }else if(sum==3){//주위의 마리수가 세마리면 생성한다
                    if(!state.cells[ix][iy]){
                        changedCell.push({x:ix,y:iy});
                        //셀의 상태 변경을 요청한다
                        state.tellCellChange(ix,iy,1);
                    }   
                }
            }
        }
        //전체 셀의 상태를 확인하고 셀의 상태를 변경한다 (배타적 논리합의 결과 0->1, 1->0 이 된다)
        for(var i=0;i<changedCell.length;i++){
            state.cells[changedCell[i].x][changedCell[i].y]^=1;
        }
        //다음 세대로 교체하고 세대 표시의 변경을 요청한다
        state.tellGenerationChange(state.generation++);
    };

    //그 다음에는 셀의 상태를 설정하는 메서드를 정의합니다. setLife 메서드는 셀(ix,iy) 값에 생물의 생사 여부를 기록합니다. 0이면 죽이고 1이면 탄생, 2면 생사를 반전시킵니다
    state.setLife = function(ix,iy,life){
        if(life==2){//생물의 삶과 죽음을 반대로 설정한다 (0->1, 1->0)
            state.cells[ix][iy]^=1;//배타적 논리합. 좌변 값은 0 또는 1인데(죽어있거나 살아있거나) 0이라면 0^1 은 1이기 때문에 죽어있던 것을 살리고, 1이라면 1^1 은 0이기 때문에 살아있던걸 죽일 수 있다. 해당 연산자를 매우 적절하게 활용한 예라는 생각이 든다
            state.tellCellChange(ix,iy,state.cells[ix][iy]); //셀의 상태 변경을 요청한다.
        }else{//지정한 life 값으로 덮어쓴다
            if(state.cells[ix][iy]!=life){
                state.cells[ix][iy]=life;
                state.tellCellChange(ix,iy,life);
            }
        }
    };

    //모든 셀을 지우는 메서드
    state.clearAllCell = function(){
        //모든 셀의 상태 값을 0으로 설정한다
        for(var ix=0;ix<state.nx;ix++){
            for(var iy=0; iy<state.ny;iy++){
                state.setLife(ix,iy,0);
            }
        }
        //세대를 0으로 설정하고 세대 표시의 변경을 요청한다
        state.tellGenerationChange(state.generation=0);
    };


    //view객체의 정의~!!
    view.create = function(nx, ny, width, height){
        view.layer = [];
        view.layer[0] = elt("canvas",{id:"rayer0",width: width, height: height});//생물 표시 레이어
        view.layer[1] = elt("canvas",{id:"rayer1",width: width, height: height});//격자 선 레이어
        
        view.nx = nx;
        view.ny = ny;
        view.cellWidth = view.layer[0].width/nx; //셀 너비
        view.cellHeight = view.layer[0].height/ny; //셀 높이

        view.markRadius = (Math.min(view.cellWidth, view.cellHeight)/2.5+0.5) | 0; //생물을 표현하는 원의 반지름

        //canvas의 렌더링 컨텍스트 가져오기
        if(view.ctx) delete view.ctx;
        view.ctx = [];
        for(var i=0; i<view.layer.length; i++){
            view.ctx.push(view.layer[i].getContext("2d"));
        }
        //렌더링 매개변수의 초기 설정
        view.backColor = "forestgreen"; //배경색상
        view.markColor = "white"; //생물색상
        view.strokeStyle = "black"; //격자 선의 색상
        view.lineWidth = 0.2; //격자 선의 너비
        //격자를 그린다
        view.drawLattice();
        //세대를 표시하는 element를 생성한다
        view.genertaion = elt("span",{id: "generation"});
        view.statuspanel = elt("div",{class:"status"},"세대 :",view.generation);

        //clickview 이벤트를 발생시킬 때 사용할 이벤트 객체를 생성한다.
        view.clickview = document.createEvent("HTMLEvents");
        //layer[1]을 클릭했을 때 동작하는 이벤트 리스너를 등록한다.
        view.layer[1].addEventListener("click", function(e){
            var ix = Math.floor(e.offsetX/view.cellWidth);//셀의 x방향 번호. 참고로 math.floor는 버림.
            var iy = Math.floor(e.offsetY/view.cellHeight);//셀의 y방향 번호
            //view의 (ix,iy)지점을 클릭했음을 clickview 이벤트로 알린다
            view.clickEvent.initEvent("clickview",false,false);
            view.clickEvent.detail = {ix:ix, iy:iy, life:2};
            document.dispatchEvent(view.clickEvent);
        },false);

        //changeCell 이벤트 리스너 등록 : state에서 받은 이벤트로 셀을 다시 그린다
        document.addEventListener("changecell",function(e){
            view.drawCell(e.detail.ix, e.detail.iy, e.detail.life);
        },false);
        //changeGeneration 이벤트 리스너 등록 : state에서 받은 이벤트로 세대 표시를 갱신한다
        document.addEventListener("changegeneration",function(e){
            view.showGeneration(e.detail.generation);
        },false);

        //viewpanel 요소의 객체를 반환한다.
        return elt(
            "div", {class:"viewpanel"}, view.layer[0], view.layer[1], view.statuspanel
        );
    };



