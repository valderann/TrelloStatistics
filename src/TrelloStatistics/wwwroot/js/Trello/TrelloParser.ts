module Scripts.Components {
    declare var Chart;
    declare var Trello;
    export class TrelloComponentPage {
        // Todo: fill in valid trello API key
        private trelloKey: string = "";

        constructor() {
            this.initialize();
        }

        private trelloBoard:TrelloBoard;
        public initialize()
        {
            this.cardView = new koCardView();
            this.boardView = new koBoardView();
            ko.applyBindings(this.cardView, document.getElementById("cardsTemplate"));
            ko.applyBindings(this.boardView, document.getElementById("boardsTemplate"));

            var instance = this;
            $("#processTrelloFile").click(() => {
                $("#boardsTemplate").hide();
                $("#trelloJsonFile").change(function () { instance.uploadFile(); });
                document.getElementById('trelloJsonFile').click();
            });

            $("#processTrelloApiButton").click(() => {
                this.authenticateWithTrello();
            });

            $(window).scroll(function () {
                    var scrollTop = $(window).scrollTop();
                    var windowHeight = $(window).height();
                    var documentHeight = $(document).height();
                    if (scrollTop > windowHeight) {
                        $("#toTop").fadeIn();
                    } else {
                        $("#toTop").fadeOut();
                    }
            });

            $("#toTop").click(function () {
                    $('html, body').animate({
                        scrollTop: 0
                    }, 'slow');
            });
        }  
        
        public uploadFile() {
            var instance = this;
            var input = <HTMLInputElement>document.getElementById('trelloJsonFile');
            if (input.files.length > 0) {
                var file = input.files[0];
                var fr = new FileReader();
                fr.onload = function(e:any) {
                    var lines = e.target.result;
                    var board = SerializationHelper.toInstance<TrelloBoard>(new TrelloBoard(), lines);
                    instance.parseJson(board, instance);
                };
                fr.readAsText(file);
            }
        }

        public getDataFromApi(url:string, returnfunction:any):any
        {
            $.ajax(url, {
                success: (data) => {
                    returnfunction(data);
                },
                error: () => {
                    console.log("error");
                }
            });
        }

        private boardView: koBoardView;
        public authenticateWithTrello()
        {
            var authenticationSuccess = ()=>{
                console.log("Successful authentication");
                this.getDataFromApi("https://api.trello.com/1/members/me/boards?key=" + this.trelloKey + "&token=" + Trello.token(), (boards)=>{
                    this.boardView.boards(boards);
                    $("#boardsTemplate").show();
                    $('html, body').animate({
                        scrollTop: $("#boardsTemplate").offset().top
                    }, 'slow');

                    $(".boardButton").click((evt) => {
                               $(".boardButton").removeClass("active");
                               $(evt.target).addClass("active");
                               var boardId = $(evt.target).attr("data-id");
                               var cards = this.getDataFromApi("https://api.trello.com/1/boards/" + boardId + "?actions=createCard&lists=all&members=all&cards=all&key=" + this.trelloKey + "&token=" + Trello.token(),
                                   (data) => {
                                      this.parseJson(data, this);
                                   }
                                );
                    });
                });
              
            };

            var authenticationFailure =  ()=> {
                console.log("Failed authentication");
            };
            Trello.authorize({
                type: "popup",
                name: "TrelloStatistics",
                scope: {
                    read: true,
                    write: false
                },
                expiration: "never",
                success: authenticationSuccess,
                error: authenticationFailure
            });
            
        }

        private getCreatedActionByCard(cardId: String) : TrelloAction
        {
            var actions = this.trelloBoard.actions;
            for (var obj in actions)
            {
                if (actions[obj].data && actions[obj].data.card  && actions[obj].data.card.id === cardId && actions[obj].type === "createCard" ) return actions[obj];
            }
            return null;
        }

        private showErrorMessage(msg:string)
        {
            $("#errorMsg").show();
            $("#errorMsg").html(msg);
        }

        private getCardsByMonthYear(cards: TrelloCard[], year?: number, month?: number): TrelloCard[]{
            var returnCards: TrelloCard[] = new Array();
            for (var obj in cards) {
                var card = cards[obj];
                var date = new Date(card.dateLastActivity);
                var action = this.getCreatedActionByCard(card.id);
                if (action !== null) { date = new Date(action.date); }
                if ((date.getFullYear() === year) && (date.getMonth() === month))
                {
                    returnCards.push(card); 
                }
            }
            return returnCards;
        }

        private getCardsByUser( cards: TrelloCard[],memberId:String): trelloTask[]  {
            var returnCards: trelloTask[] = new Array();
            for (var obj in cards) {
                var card = cards[obj];
                if (card.idMembers.indexOf(memberId) > -1) {
                    var task = new trelloTask();
                    task.title = card.name;
                    task.url = card.shortUrl;
                    returnCards.push(task);
                }
                else if (card.idMembers.length === 0)
                {
                    var action = this.getCreatedActionByCard(card.id);
                    if (action !== null && action.idMemberCreator===memberId) {
                        var task = new trelloTask();
                        task.title = card.name;
                        task.url = card.shortUrl;
                        returnCards.push(task);
                    }
                }
            }
            return returnCards;
        }

        private aggregateBySwimlane(cards: TrelloCard[], lists: TrelloList[]): aggregatedCard[] {

            var aggSwimlanes = new Array<aggregatedCard>();
            for (var lst in lists) {
                var list = lists[lst];
                var count = 0;
                for (var obj in cards) {
                    var card = cards[obj];
                    if (card.idList === list.id) {
                        count += 1;
                    }
                }
                var aggSwimlane = new aggregatedCard();
                aggSwimlane.count = count;
                aggSwimlane.name = list.name;
                aggSwimlanes.push(aggSwimlane);
            }

            return aggSwimlanes;
        }

        private aggregateCards(members: TrelloMember[], cards: TrelloCard[]): aggregatedCard[] {
           
            var aggCards = new Array<aggregatedCard>();
            for (var memberIndex in members) {
                var counter = 0;
                var member = members[memberIndex];
                for (var obj in cards) {
                    var card = cards[obj];
                    if (card.idMembers.indexOf(member.id) > -1) {
                        counter++;
                    }
                }
                if (counter > 0) {
                    var aggCard = new aggregatedCard();
                    aggCard.name = member.fullName;
                    aggCard.count = counter;
                    aggCards.push(aggCard);
                }
            }
            return aggCards;
        }

        private convertAreaChart(members: TrelloMember[], cards: TrelloCard[]) {
            var multiArray = [];
            multiArray.push(["month"]);
            for (var memberIndex in members) {
                var counter = 0;
                var member = members[memberIndex];
                multiArray[0].push(member.fullName);
            }
           
            for (var i = 0; i < 12; i++)
            {
                var cardsMonth = this.getCardsByMonthYear(cards, new Date().getFullYear(), i);
                var aggCards = this.aggregateCards(members, cardsMonth);
                multiArray.push(["" + (i+1)]);
                for (var memberIndex in members) {
                    var member = members[memberIndex];
                    var found = false;
                    for (var key in aggCards) {
                        var aggcard = aggCards[key];
                        if (aggcard.name === member.fullName) { 
                            multiArray[i + 1].push(aggCards[key].count);
                            found = true;
                        }
                    }
                    if (!found) { multiArray[i + 1].push(0);}
                }
            }
            return multiArray;
        }

        private convertPieChart(original: aggregatedCard[]) {
            var multiArray = [];
            multiArray.push(["name", "amount"]);
            for (var key in original) { multiArray.push([original[key].name, original[key].count]); }
            return multiArray;
        }

        private drawPieGraphUsers(members: TrelloMember[], cards: TrelloCard[]):void
        {
            var aggcards = this.aggregateCards(members, cards);
            //var data = google.visualization.arrayToDataTable(this.convertPieChart(aggcards));
            //var options = {
            //    title: 'User activity',
            //    is3D: true,
            //    'width': 700,
            //    'height': 700
            //};

            //var piechart = new google.visualization.PieChart(document.getElementById('piechartUser'));
            //piechart.draw(data, options);
        }

        private drawPieGraphSwimlanes( cards: TrelloCard[],lists: TrelloList[]): void {
            var aggcards = this.aggregateBySwimlane(cards, lists);
            var ctx = (<HTMLCanvasElement>document.getElementById("piechartSwimlane")).getContext("2d");
            var pieChart = new Chart(ctx).Pie(aggcards, {});
            //var data = google.visualization.arrayToDataTable(this.convertPieChart(aggcards));
            //var options = {
            //    title: 'Swim lane',
            //    is3D: true,
            //    'width': 700,
            //    'height': 700
            //};

            //var piechart = new google.visualization.PieChart(document.getElementById('piechartSwimlane'));
            //piechart.draw(data, options);
        }

        private drawAreaGraph(members: TrelloMember[], cards: TrelloCard[]):void
        {
            //var dataArea = google.visualization.arrayToDataTable(this.convertAreaChart(members,cards));

            //var optionsArea = {
            //    title: 'User activity',
            //    'width': 700,
            //    'height': 400
            //};

            //var areachart = new google.visualization.AreaChart(document.getElementById('areachart'));
            //areachart.draw(dataArea, optionsArea);
        }

        private cardView: koCardView;
        private drawTasks(members: TrelloMember[], cards: TrelloCard[],name:String): void
        {
            var aggcards = this.aggregateCards(members, cards);
            this.cardView.boardName(name);
            this.cardView.aggregatedCards(aggcards);

            var tasks = new Array<trelloTaskList>();
            for (var memberIndex in members) {
                var member = members[memberIndex];
                var cardsUser = this.getCardsByUser(cards, member.id);
                if (cardsUser.length > 0) {
                    var task = new trelloTaskList();
                    task.icon = (member.avatarHash) ? "https://trello-avatars.s3.amazonaws.com/" + member.avatarHash + "/30.png" : undefined;
                    task.userName = member.fullName;
                    task.userTasks = this.getCardsByUser(cards, member.id);
                    tasks.push(task);
                }
            }
            this.cardView.tasks(tasks); 
        }

        private parseJson(e, instance: TrelloComponentPage) {
            this.trelloBoard= e;

            var jsonObj = this.trelloBoard;
            var optionsDropDown = [];
            optionsDropDown.push('<option value="">All</option>');
            for (var i = 0; i < 12; i++) {
                optionsDropDown.push('<option value="'+ i+ '">'+ (i+1)+ '</option>');
            }

            $("#periodDropdown").html(optionsDropDown.join(''));
            $("#periodDropdown").change(() => {
                var cards = this.trelloBoard.cards;
                var periodMonth = $("#periodDropdown").val();
                if (periodMonth !== ""){
                   cards = this.getCardsByMonthYear(this.trelloBoard.cards, new Date().getFullYear(), parseInt(periodMonth));
                }
                this.drawAreaGraph(this.trelloBoard.members, cards);
                this.drawPieGraphUsers(this.trelloBoard.members, cards);
                this.drawPieGraphSwimlanes(cards, this.trelloBoard.lists);
                this.drawTasks(this.trelloBoard.members, cards, this.trelloBoard.name);
            });

            this.drawAreaGraph(this.trelloBoard.members, this.trelloBoard.cards);
            this.drawPieGraphUsers(this.trelloBoard.members, this.trelloBoard.cards);
            this.drawPieGraphSwimlanes(this.trelloBoard.cards, this.trelloBoard.lists);
            this.drawTasks(this.trelloBoard.members, this.trelloBoard.cards, this.trelloBoard.name);

            $("#cardsTemplate").show();
            $('html, body').animate({
                scrollTop: $("#cardsTemplate").offset().top
            }, 'slow');
        }
    }
}


$(document).ready(() => {
    //if (!google) { alert("no internet connection!");}
    //google.load("visualization", "1", {
    //    packages: ["corechart"] ,callback: function () {
    //    }
    //});
    var TrelloComponentPage = new Scripts.Components.TrelloComponentPage();
});