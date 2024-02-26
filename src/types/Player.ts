export class Player {
    socket: any;
    name !: string;
    id !: string;

    playingAs !: "CROSS" | "CIRCLE";

    constructor(socket: any, id: string, name: string, playingAs: "CROSS" | "CIRCLE") {
        this.socket = socket;
        this.playingAs = playingAs;
        this.name = name;
        this.id = id;
    }
}