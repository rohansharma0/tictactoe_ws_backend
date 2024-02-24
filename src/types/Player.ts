export class Player {
    socket: any;
    online: boolean = true;
    name !: string;
    id !: string;

    constructor(socket: any, id: string, name: string, online: boolean) {
        this.socket = socket;
        this.online = online;
        this.name = name;
        this.id = id;
    }
}