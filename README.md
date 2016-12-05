###Intro. to RethinkDB Changefeeds using Node.js and Docker Compose

This repository contains a simple Node.js app that shows you how to use RethinkDB Changefeeds(https://www.rethinkdb.com/docs/changefeeds/ruby/).
The intent of this project is to provide you with an introduction to RethinkDB using Node.js and Docker.

Follow these simple instructions and you'll be up and running:

```
git clone https://github.com/markwatsonatx/tutorial-rethinkdb-nodejs-changes
cd utorial-rethinkdb-nodejs-changes
docker-compose up -d
```

After running `docker-compose up -d` you can access the sample application at [http://DOCKER-HOST-IP:33000/](http://localhost:33000).
You can access the RethinkDB administration console at [http://DOCKER-HOST-IP:38080](http://localhost:38080).

You can learn more by watching the YouTube video [here](https://youtu.be/dabkH3bUXHI).