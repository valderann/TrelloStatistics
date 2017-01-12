module Scripts.Components {

    export class TrelloData {
        card: TrelloCard;
    }

    export class TrelloList {
        id: String;
        name: String;
    }

    export class aggregatedCard {
        count: Number;
        name: String;
    }

    export  class trelloTaskList {
        userName: String;
        icon: String;
        userTasks: trelloTask[]
    }

    export  class trelloTask {
        title: String;
        url: String;
    }

    export class TrelloJsonBoard {
        id: String;
        name: String;
        shortUrl: String;
    }


    export class koBoardView {
        boards: any = ko.observable();
    }

    export  class koCardView {
        boardName: any = ko.observable();
        aggregatedCards: any = ko.observable();
        tasks: any = ko.observable();
    }
}