# Используйте официальный образ Node.js
FROM node:16

# Установите рабочую директорию
WORKDIR /app

# Копируйте package.json и package-lock.json (если есть) в контейнер
COPY package*.json ./

# Установите зависимости
RUN npm install

# Копируйте все файлы проекта в контейнер
COPY . .

# Откройте порт 3000
EXPOSE 8000

# Запустите приложение
CMD ["npm", "run", "dev"]
