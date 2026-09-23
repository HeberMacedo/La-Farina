FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VUE_APP_API_BASE_URL=http://localhost:3000
ARG VUE_APP_PUBLIC_PATH=/

ENV VUE_APP_API_BASE_URL=${VUE_APP_API_BASE_URL}
ENV VUE_APP_PUBLIC_PATH=${VUE_APP_PUBLIC_PATH}

RUN npm run build

FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
