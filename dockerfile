FROM node:argon

# use this build command
#  docker build -f nodesite.dockerfile -t stevestrongbah/rethinker .

# use this run command
#  docker run -d -p 4000:3000 -p 4040:8080 --name thinker stevestrongbah/rethinker
#  docker rm -g thinker

#test server
# docker-machine ip

#push to hub
#  docker pull datalift/rethink.datalift
#  docker push datalift/rethink.datalift

# Add the RethinkDB repository and public key
# "RethinkDB Packaging <packaging@rethinkdb.com>" http://download.rethinkdb.com/apt/pubkey.gpg
RUN apt-key adv --keyserver pgp.mit.edu --recv-keys 1614552E5765227AEC39EFCFA7E00EF33A8F2399
RUN echo "deb http://download.rethinkdb.com/apt jessie main" > /etc/apt/sources.list.d/rethinkdb.list

ENV RETHINKDB_PACKAGE_VERSION 2.3.4~0jessie

RUN apt-get update \
	&& apt-get install -y rethinkdb=$RETHINKDB_PACKAGE_VERSION \
	&& rm -rf /var/lib/apt/lists/*


#   process cluster webui
EXPOSE 28015 29015 8080

ENV APP=/var/www

# Create app directory
RUN mkdir -p $APP
WORKDIR $APP

# Install app dependencies
COPY package.json $APP
RUN npm install --production

# Bundle app source
COPY . $APP

EXPOSE 3000 3001
CMD [ "npm", "start", "--production" ]
