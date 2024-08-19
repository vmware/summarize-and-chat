FROM node:16-alpine as builder
RUN node --version
COPY package.json .
RUN npm i && mkdir /app && cp -R ./node_modules ./app
WORKDIR /app
COPY . .

RUN chown node -R /app && chmod +x docker-entrypoint.sh 
USER node
RUN node_modules/.bin/ng build --configuration=ENVIRONMENT
FROM nginx:1.24.0
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/docker-entrypoint.sh /
COPY --from=builder /app/dist/summarization-client /usr/share/nginx/html
USER root
RUN chmod -R o+w /usr/share/nginx/html /var/cache/nginx /var/run
USER nginx
EXPOSE 5000

ENTRYPOINT ["/docker-entrypoint.sh"]




