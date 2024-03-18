# Express JS PostgresML example

## Overview
The purpose of this repository is to demonstrates how to quickly get up and running with machine learning in an Express application. 

This application is a simple note taking application.  It analyzes all the notes taken in a day and performs summarization and sentiment analysis on them. 

All our ML occurs in the database where the notes are stored.  This means just by connecting to the database we are able to train and deploy ML/AI models and have a production ready pipeline. 

## Setup
This example application requires a PostgreSQL database with the pgml and pgvector extension installed. The easiest way to do this is with a free database at [postgresml.org](https://postgresml.org/).

Clone this repository.  Once you have your PostgresML database, or local PostgreSQL with the extensions installed, create a .env file and add `DATABASE_URL=<your_db_url>` replacing your_db_url. 

Next install all required node packages with `node install`.

## Running the app
Start the express server by running the following 

```bash
npm run devStart
```

This will launch the application at [localhost:3000](http://localhost:3000/)

## Usage
In a browser, navigate to localhost:3000.  Recored a note in the text area on the left and click submit.  Do this a couple times.  On the right click Analyze Day,  this will  produce a sentiment analysis score and a summarization of your day.  

## Code
We can augment this code to perform all types of ML.  Checkout the [postgresML docs](https://postgresml.org/docs/api/sql-extension/) for a full list.

If you are unhappy with the quality of the results, rest assured, higher quality models are available. 

In this example we directly interacted with the extension using PostgreSQL.  If you would prefer JS, see our [JS SDK](https://postgresml.org/docs/api/client-sdk/)
