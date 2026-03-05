FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]
