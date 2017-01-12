var Scripts;
(function (Scripts) {
    var Components;
    (function (Components) {
        var TrelloComponentPage = (function () {
            function TrelloComponentPage() {
                // Todo: fill in valid trello API key
                this.trelloKey = "";
                this.initialize();
            }
            TrelloComponentPage.prototype.initialize = function () {
                var _this = this;
                this.cardView = new Components.koCardView();
                this.boardView = new Components.koBoardView();
                ko.applyBindings(this.cardView, document.getElementById("cardsTemplate"));
                ko.applyBindings(this.boardView, document.getElementById("boardsTemplate"));
                var instance = this;
                $("#processTrelloFile").click(function () {
                    $("#boardsTemplate").hide();
                    $("#trelloJsonFile").change(function () { instance.uploadFile(); });
                    document.getElementById('trelloJsonFile').click();
                });
                $("#processTrelloApiButton").click(function () {
                    _this.authenticateWithTrello();
                });
                $(window).scroll(function () {
                    var scrollTop = $(window).scrollTop();
                    var windowHeight = $(window).height();
                    var documentHeight = $(document).height();
                    if (scrollTop > windowHeight) {
                        $("#toTop").fadeIn();
                    }
                    else {
                        $("#toTop").fadeOut();
                    }
                });
                $("#toTop").click(function () {
                    $('html, body').animate({
                        scrollTop: 0
                    }, 'slow');
                });
            };
            TrelloComponentPage.prototype.uploadFile = function () {
                var instance = this;
                var input = document.getElementById('trelloJsonFile');
                if (input.files.length > 0) {
                    var file = input.files[0];
                    var fr = new FileReader();
                    fr.onload = function (e) {
                        var lines = e.target.result;
                        var board = Components.SerializationHelper.toInstance(new Components.TrelloBoard(), lines);
                        instance.parseJson(board, instance);
                    };
                    fr.readAsText(file);
                }
            };
            TrelloComponentPage.prototype.getDataFromApi = function (url, returnfunction) {
                $.ajax(url, {
                    success: function (data) {
                        returnfunction(data);
                    },
                    error: function () {
                        console.log("error");
                    }
                });
            };
            TrelloComponentPage.prototype.authenticateWithTrello = function () {
                var _this = this;
                var authenticationSuccess = function () {
                    console.log("Successful authentication");
                    _this.getDataFromApi("https://api.trello.com/1/members/me/boards?key=" + _this.trelloKey + "&token=" + Trello.token(), function (boards) {
                        _this.boardView.boards(boards);
                        $("#boardsTemplate").show();
                        $('html, body').animate({
                            scrollTop: $("#boardsTemplate").offset().top
                        }, 'slow');
                        $(".boardButton").click(function (evt) {
                            $(".boardButton").removeClass("active");
                            $(evt.target).addClass("active");
                            var boardId = $(evt.target).attr("data-id");
                            var cards = _this.getDataFromApi("https://api.trello.com/1/boards/" + boardId + "?actions=createCard&lists=all&members=all&cards=all&key=" + _this.trelloKey + "&token=" + Trello.token(), function (data) {
                                _this.parseJson(data, _this);
                            });
                        });
                    });
                };
                var authenticationFailure = function () {
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
            };
            TrelloComponentPage.prototype.getCreatedActionByCard = function (cardId) {
                var actions = this.trelloBoard.actions;
                for (var obj in actions) {
                    if (actions[obj].data && actions[obj].data.card && actions[obj].data.card.id === cardId && actions[obj].type === "createCard")
                        return actions[obj];
                }
                return null;
            };
            TrelloComponentPage.prototype.showErrorMessage = function (msg) {
                $("#errorMsg").show();
                $("#errorMsg").html(msg);
            };
            TrelloComponentPage.prototype.getCardsByMonthYear = function (cards, year, month) {
                var returnCards = new Array();
                for (var obj in cards) {
                    var card = cards[obj];
                    var date = new Date(card.dateLastActivity);
                    var action = this.getCreatedActionByCard(card.id);
                    if (action !== null) {
                        date = new Date(action.date);
                    }
                    if ((date.getFullYear() === year) && (date.getMonth() === month)) {
                        returnCards.push(card);
                    }
                }
                return returnCards;
            };
            TrelloComponentPage.prototype.getCardsByUser = function (cards, memberId) {
                var returnCards = new Array();
                for (var obj in cards) {
                    var card = cards[obj];
                    if (card.idMembers.indexOf(memberId) > -1) {
                        var task = new Components.trelloTask();
                        task.title = card.name;
                        task.url = card.shortUrl;
                        returnCards.push(task);
                    }
                    else if (card.idMembers.length === 0) {
                        var action = this.getCreatedActionByCard(card.id);
                        if (action !== null && action.idMemberCreator === memberId) {
                            var task = new Components.trelloTask();
                            task.title = card.name;
                            task.url = card.shortUrl;
                            returnCards.push(task);
                        }
                    }
                }
                return returnCards;
            };
            TrelloComponentPage.prototype.aggregateBySwimlane = function (cards, lists) {
                var aggSwimlanes = new Array();
                for (var lst in lists) {
                    var list = lists[lst];
                    var count = 0;
                    for (var obj in cards) {
                        var card = cards[obj];
                        if (card.idList === list.id) {
                            count += 1;
                        }
                    }
                    var aggSwimlane = new Components.aggregatedCard();
                    aggSwimlane.count = count;
                    aggSwimlane.name = list.name;
                    aggSwimlanes.push(aggSwimlane);
                }
                return aggSwimlanes;
            };
            TrelloComponentPage.prototype.aggregateCards = function (members, cards) {
                var aggCards = new Array();
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
                        var aggCard = new Components.aggregatedCard();
                        aggCard.name = member.fullName;
                        aggCard.count = counter;
                        aggCards.push(aggCard);
                    }
                }
                return aggCards;
            };
            TrelloComponentPage.prototype.convertAreaChart = function (members, cards) {
                var multiArray = [];
                multiArray.push(["month"]);
                for (var memberIndex in members) {
                    var counter = 0;
                    var member = members[memberIndex];
                    multiArray[0].push(member.fullName);
                }
                for (var i = 0; i < 12; i++) {
                    var cardsMonth = this.getCardsByMonthYear(cards, new Date().getFullYear(), i);
                    var aggCards = this.aggregateCards(members, cardsMonth);
                    multiArray.push(["" + (i + 1)]);
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
                        if (!found) {
                            multiArray[i + 1].push(0);
                        }
                    }
                }
                return multiArray;
            };
            TrelloComponentPage.prototype.convertPieChart = function (original) {
                var multiArray = [];
                multiArray.push(["name", "amount"]);
                for (var key in original) {
                    multiArray.push([original[key].name, original[key].count]);
                }
                return multiArray;
            };
            TrelloComponentPage.prototype.drawPieGraphUsers = function (members, cards) {
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
            };
            TrelloComponentPage.prototype.drawPieGraphSwimlanes = function (cards, lists) {
                var aggcards = this.aggregateBySwimlane(cards, lists);
                var ctx = document.getElementById("piechartSwimlane").getContext("2d");
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
            };
            TrelloComponentPage.prototype.drawAreaGraph = function (members, cards) {
                //var dataArea = google.visualization.arrayToDataTable(this.convertAreaChart(members,cards));
                //var optionsArea = {
                //    title: 'User activity',
                //    'width': 700,
                //    'height': 400
                //};
                //var areachart = new google.visualization.AreaChart(document.getElementById('areachart'));
                //areachart.draw(dataArea, optionsArea);
            };
            TrelloComponentPage.prototype.drawTasks = function (members, cards, name) {
                var aggcards = this.aggregateCards(members, cards);
                this.cardView.boardName(name);
                this.cardView.aggregatedCards(aggcards);
                var tasks = new Array();
                for (var memberIndex in members) {
                    var member = members[memberIndex];
                    var cardsUser = this.getCardsByUser(cards, member.id);
                    if (cardsUser.length > 0) {
                        var task = new Components.trelloTaskList();
                        task.icon = (member.avatarHash) ? "https://trello-avatars.s3.amazonaws.com/" + member.avatarHash + "/30.png" : undefined;
                        task.userName = member.fullName;
                        task.userTasks = this.getCardsByUser(cards, member.id);
                        tasks.push(task);
                    }
                }
                this.cardView.tasks(tasks);
            };
            TrelloComponentPage.prototype.parseJson = function (e, instance) {
                var _this = this;
                this.trelloBoard = e;
                var jsonObj = this.trelloBoard;
                var optionsDropDown = [];
                optionsDropDown.push('<option value="">All</option>');
                for (var i = 0; i < 12; i++) {
                    optionsDropDown.push('<option value="' + i + '">' + (i + 1) + '</option>');
                }
                $("#periodDropdown").html(optionsDropDown.join(''));
                $("#periodDropdown").change(function () {
                    var cards = _this.trelloBoard.cards;
                    var periodMonth = $("#periodDropdown").val();
                    if (periodMonth !== "") {
                        cards = _this.getCardsByMonthYear(_this.trelloBoard.cards, new Date().getFullYear(), parseInt(periodMonth));
                    }
                    _this.drawAreaGraph(_this.trelloBoard.members, cards);
                    _this.drawPieGraphUsers(_this.trelloBoard.members, cards);
                    _this.drawPieGraphSwimlanes(cards, _this.trelloBoard.lists);
                    _this.drawTasks(_this.trelloBoard.members, cards, _this.trelloBoard.name);
                });
                this.drawAreaGraph(this.trelloBoard.members, this.trelloBoard.cards);
                this.drawPieGraphUsers(this.trelloBoard.members, this.trelloBoard.cards);
                this.drawPieGraphSwimlanes(this.trelloBoard.cards, this.trelloBoard.lists);
                this.drawTasks(this.trelloBoard.members, this.trelloBoard.cards, this.trelloBoard.name);
                $("#cardsTemplate").show();
                $('html, body').animate({
                    scrollTop: $("#cardsTemplate").offset().top
                }, 'slow');
            };
            return TrelloComponentPage;
        }());
        Components.TrelloComponentPage = TrelloComponentPage;
    })(Components = Scripts.Components || (Scripts.Components = {}));
})(Scripts || (Scripts = {}));
$(document).ready(function () {
    //if (!google) { alert("no internet connection!");}
    //google.load("visualization", "1", {
    //    packages: ["corechart"] ,callback: function () {
    //    }
    //});
    var TrelloComponentPage = new Scripts.Components.TrelloComponentPage();
});
