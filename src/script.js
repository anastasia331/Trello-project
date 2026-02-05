import { ApiService } from './ApiService.js'
import { Storage } from './storage.js'
import { Task } from './task.js'

class App {
    constructor() {
        this.tasks = Storage.get()//извлекаем задачи из браузера
        this.editId = null //сохраняем id редактируемой задачи

        // Поиск элементов по id. ищем 1 раз
        this.modalOverlay = document.getElementById('modal__overlay')
        this.titleInput = document.getElementById('todo-title')
        this.descInput = document.getElementById('todo-desc')
        this.prioritySelect = document.querySelector('.modal__priority')
        this.userSelect = document.getElementById('todo-user')
        this.modalConfirmBtn = document.getElementById('modal-confirm')

        this.init()
    }

    async init() {
        await this.loadUsers() //загружаем список пользователей
        this.setupClock()//загружаем часы
        this.bindEvents() //вешаем обработчики
        this.render()//отрисовка задачи на экран
    }

    // --- Часы ---
    setupClock() {
        const update = () => {
            const el = document.querySelector('.board__clock');
            if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) //показыве=аем часы в формате ЧЧ:ММ
        }
        setInterval(update, 1000)
        update() //запускем часы сразу, не дожидаясь секунды
    }

    // --- Пользователи ---
    async loadUsers() {
        const users = await ApiService.fetchUsers() //делаем запрос
        this.userSelect.innerHTML = '<option value="" disabled selected>Ответственный</option>'
        //сбрасываем занчения и заполняем форму
        if (users) {//если полььзователи загружены
            users.forEach(({ name }) => {//пройдемся  по циклу
                const option = document.createElement('option')
                option.value = name
                option.textContent = name
                this.userSelect.appendChild(option)
            })//добавит элемент с пользователем в выпадающий список
        } else {
            this.userSelect.innerHTML = '<option value="Default User">Ошибка</option>'//иначе ошибка
        }
    }

    // --- Модальное окно: ---
    toggleModal(show, task = null) { //Показываем или скрываем окно
        this.modalOverlay.style.display = show ? 'flex' : 'none';
        if (show && task) {//если покакзываем и есть данные задачи - редактируем
            const { id, title, desc, priority, user } = task
            this.editId = id
            this.titleInput.value = title
            this.descInput.value = desc
            this.prioritySelect.value = priority
            this.userSelect.value = user
        } else {// иначе закрываем или открываем для создания задачи
            this.editId = null
            this.titleInput.value = ''
            this.descInput.value = ''
            this.userSelect.selectedIndex = 0 //строка пользователя по умолчанию
        }
    }
    //сохранение  или обновление задачи

    handleConfirm() {
        const title = this.titleInput.value.trim()//получаем  заголовок
        const user = this.userSelect.value //получаем ответственного
        const desc = this.descInput.value //получаем  описание задачи
        const priority = this.prioritySelect.value //получаем  приоритет

        if (!title || !user) return alert('Заполните заголовок и ответственного!')

        if (this.editId) {//проверяем есть ли id редактируемой задачи
            const task = this.tasks.find(t => t.id === this.editId)//ищем саму задачу
            Object.assign(task, { title, desc, priority, user })//обновляем свойства
        } else {
            const newTask = new Task({ title, desc, priority, user })
            this.tasks.push(newTask)
        }//иначе создаем новую

        this.saveAndRender()//вызываем метод и сохраняем
        this.toggleModal(false)//закрываем окно
    }
    render() {//отрисовка карточек на доске
        const statuses = ['todo', 'progress', 'done'] //список этапов задач
        const columns = document.querySelectorAll('.column') //находим колонки

        columns.forEach((col, idx) => {
            const status = statuses[idx]//сопоставляем колонку с ее логическим статусом
            let container = col.querySelector('.column__content') || this.createContainer(col)
            // container.innerHTML = ''

            const columnTasks = this.tasks.filter(t => t.status === status) //выбираем из списка задачи, которые сюда относятся
            col.querySelector('.column__count').textContent = columnTasks.length //обновляем счетчик

            columnTasks.forEach(task => {
                const card = this.createCard(task, status, statuses)
                container.appendChild(card)
            })

            if (status === 'done') this.renderDeleteAll(col, columnTasks.length)//если это колонка DONE, добавим кнопку
        })
    }
//создаем карточку новой задачи
    createCard(task, currentStatus, allStatuses) {//принмает объект задачи,текущий статус и все возможные статусы
        const { id, title, desc, user, createdAt, priority } = task//извлекаем свойства задач
        const card = document.createElement('article')
        card.className = `card card--${priority}` 
        //настройка цвета фона
        const colors = { todo: { low: '#97ffb0', medium: '#f3e86d', high: '#f73542' }, progress: '#54f56f', done: '#ccc3c3' }
        card.style.backgroundColor = (currentStatus === 'todo') ? colors.todo[priority] : colors[currentStatus]
// создаем карточку
        card.innerHTML = `<time class="card__time">${createdAt}</time>
            <h3 class="card__title">${title}</h3> 
             <p class="card__desc">${desc}</p>
            
            <div class="card__footer"><span>${user}</span></div>
            <select class="card__move-select" onchange="app.move(${id}, this.value)">
                <option value="" disabled selected>Move to...</option>
                ${allStatuses.filter(s => s !== currentStatus).map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('')}
            </select>
            <div class="card__actions">
                ${currentStatus !== 'done' ? `<button class="btn btn__edit" onclick="app.edit(${id})">EDIT</button>` : ''}
                <button class="btn btn__delete" onclick="app.delete(${id})">DELETE</button>
            </div>`
        return card //возвращаем готовый объект карточки, которая будет добавлена на страницу
    }
//появление кг=нопки delete all

    renderDeleteAll(column, count) {
        // Находим контейнер, гду у нас карточки
        const container = column.querySelector('.column__content')
        if (!container) return;

        // Ищем кнопку внутри контейнера, что бы небыло дубликатов
        let btn = container.querySelector('.btn__delete-all')

        if (count >= 2) {//если задач 2 и более, показываем кнопку
            if (!btn) {
                btn = document.createElement('button')
                btn.className = 'btn btn__delete-all'
                btn.textContent = 'DELETE ALL'
                btn.style.width = '100%'
                btn.onclick = () => this.deleteAllDone()//удалим все задачи при нажатии 

                container.prepend(btn)
            }
        } else {//иначе кнопку удаляем
            if (btn) {
                btn.remove()
            }
        }
    }

    // --- Действия ---
    move(id, newStatus) {//смена колонки у задачи
        if (newStatus === 'progress' && this.tasks.filter(t => t.status === 'progress').length >= 6) {
            alert('Лимит 6 задач в работе!')//проверяем на лимит 
            return this.render()
        }
        const task = this.tasks.find(t => t.id === id)
        if (task) {
            task.status = newStatus
            this.saveAndRender()
        }
    }

    delete(id) {//подтверждение на удаление
        if (confirm('Удалить карточку?')) {
            this.tasks = this.tasks.filter(t => t.id !== id)
            this.saveAndRender()
        }
    }

    deleteAllDone() {//подтверждение на удаление всех задач
        if (confirm('Удалить все завершенные задачи?')) {
            this.tasks = this.tasks.filter(t => t.status !== 'done')
            this.saveAndRender()
        }
    }
    saveAndRender() {//сохранение 
        Storage.save(this.tasks)
        this.render()
    }
    bindEvents() {
        document.getElementById('add-todo-btn').addEventListener('click', () => this.toggleModal(true))
        document.getElementById('modal-cancel').addEventListener('click', () => this.toggleModal(false))
        this.modalConfirmBtn.addEventListener('click', () => this.handleConfirm())
    }

    createContainer(col) {
        const div = document.createElement('div')
        div.className = 'column__content'
        col.appendChild(div)
        return div
    }
}


const app = new App()//выносим нужные функции в глобальный обьект, что бы браузер мог найти их при клике
window.app = {
    move: (id, val) => app.move(id, val),
    edit: (id) => app.toggleModal(true, app.tasks.find(t => t.id === id)),
    delete: (id) => app.delete(id)
}