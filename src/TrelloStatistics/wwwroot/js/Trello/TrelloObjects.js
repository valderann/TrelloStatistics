var Scripts;
(function (Scripts) {
    var Components;
    (function (Components) {
        var TrelloData = (function () {
            function TrelloData() {
            }
            return TrelloData;
        }());
        Components.TrelloData = TrelloData;
        var TrelloList = (function () {
            function TrelloList() {
            }
            return TrelloList;
        }());
        Components.TrelloList = TrelloList;
        var aggregatedCard = (function () {
            function aggregatedCard() {
            }
            return aggregatedCard;
        }());
        Components.aggregatedCard = aggregatedCard;
        var trelloTaskList = (function () {
            function trelloTaskList() {
            }
            return trelloTaskList;
        }());
        Components.trelloTaskList = trelloTaskList;
        var trelloTask = (function () {
            function trelloTask() {
            }
            return trelloTask;
        }());
        Components.trelloTask = trelloTask;
        var TrelloJsonBoard = (function () {
            function TrelloJsonBoard() {
            }
            return TrelloJsonBoard;
        }());
        Components.TrelloJsonBoard = TrelloJsonBoard;
        var koBoardView = (function () {
            function koBoardView() {
                this.boards = ko.observable();
            }
            return koBoardView;
        }());
        Components.koBoardView = koBoardView;
        var koCardView = (function () {
            function koCardView() {
                this.boardName = ko.observable();
                this.aggregatedCards = ko.observable();
                this.tasks = ko.observable();
            }
            return koCardView;
        }());
        Components.koCardView = koCardView;
    })(Components = Scripts.Components || (Scripts.Components = {}));
})(Scripts || (Scripts = {}));
