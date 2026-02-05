//получаем данные пользователей с сервера
export class ApiService {
    static async fetchUsers() {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/users')
            if (!response.ok) throw new Error('Ошибка сети')
            return await response.json()
        } catch (error) {
            console.error('Ошибка API:', error)
            return [] //в случае ошибки, получим пустой список
        }
    }
}