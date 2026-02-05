export class Task {
//данные для задачи
    constructor({ title, desc, priority, user, id = Date.now(), status = 'todo' }) {
        this.id = id
        this.title = title
        this.desc = desc
        this.priority = priority
        this.user = user
        this.status = status
        this.createdAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
}