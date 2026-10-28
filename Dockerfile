FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VUE_APP_API_BASE_URL=https://api-tpizza-artesanal.onrender.com
ARG VUE_APP_PUBLIC_PATH=/

ENV VUE_APP_API_BASE_URL=${VUE_APP_API_BASE_URL}
ENV VUE_APP_PUBLIC_PATH=${VUE_APP_PUBLIC_PATH}

RUN npm run build

# API fake (json-server) servindo o db/db.json
FROM node:22-alpine AS api

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY db ./db

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "npx json-server --watch db/db.json --host 0.0.0.0 --port $PORT"]

# Front-end (estágio padrão do "docker build .")
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
