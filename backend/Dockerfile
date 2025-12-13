FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci --only=production

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем остальные файлы
COPY . .

# Собираем TypeScript
RUN npm run build

# Порт
EXPOSE 3001

# Запуск
CMD ["npm", "start"]