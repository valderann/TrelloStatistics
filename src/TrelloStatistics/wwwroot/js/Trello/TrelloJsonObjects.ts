module Scripts.Components {
    export class TrelloBoard {
        id: String;
        name: String;
        cards: TrelloCard[];
        members: TrelloMember[];
        lists: TrelloList[];
        actions: TrelloAction[];
    }

    export  class TrelloAction {
        data: TrelloData;
        memberCreator: TrelloMember;
        date: string;
        type: String;
        idMemberCreator: string;
    }

    export class TrelloCard {
        id: String;
        desc: String;
        name: String;
        shortUrl: String;
        email: String;
        idList: String;
        idMembers: String[];
        dateLastActivity: string;
    }

    export  class TrelloMember {
        id: String;
        fullName: String;
        userName: String;
        initials: String;
        url: String;
        avatarHash: String;
    }
}