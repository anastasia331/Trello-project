//сохраняем данные в браузере

export class Storage {
    static key = 'trello-tasks'

    static get() {
        return JSON.parse(localStorage.getItem(this.key)) || []
    }

    static save(tasks) {
        localStorage.setItem(this.key, JSON.stringify(tasks))
    }
}