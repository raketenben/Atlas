FROM node
WORKDIR /usr/app
COPY ./dist/ dist/
COPY ./src/ src/
COPY ./server.js server.js
COPY ./package.json package.json
COPY ./package-lock.json package-lock.json
COPY ./tsconfig.json tsconfig.json
COPY ./webpack.config.js webpack.config.js
RUN npm install
RUN npm run build
VOLUME [ "/articles" ]
CMD [ "nodejs", "server.js" ]
EXPOSE 8080