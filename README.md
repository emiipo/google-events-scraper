# Google Events Scraper
Scraper to gather data from google events using [Crawlee](https://crawlee.dev/) made in Typescript.

## Installation & Usage
To install use the following npm command
```console
$ npm install google-events-scraper
```

Once installed it's simple as creating an object and using it
```ts
import gEventsScraper from 'google-events-scraper';

const scraper = new gEventsScraper();
const results = scraper.Scrape('google events');
```
## Date
There are two ways you can specify the date of the event but keep in mind that sometimes it will still show events outside of that range due to google.

You can specify it in the query:
```ts
const results = scraper.Scrape('google events today'); //This seems to not work so well
const results = scraper.Scrape('google events next week');
const results = scraper.Scrape('google events december 2023');
```
Or you can use the optional date parameters (this uses google's own way of checking the date but it's very limited, this example provides all the options):
```ts
const results = scraper.Scrape('google events', { today:true });
const results = scraper.Scrape('google events', { tomorrow:true });
const results = scraper.Scrape('google events', { thisWeek:true });
const results = scraper.Scrape('google events', { thisWeekend:true });
const results = scraper.Scrape('google events', { nextWeek:true });
const results = scraper.Scrape('google events', { nextMonth:true });
```
## Results
If by any chance you want the last results of the scraper you can use this function (make sure it has ran at least once):
```ts
const results2 = scraper.GetResults();
```
The results you will recieve and some things to keep in mind:
```ts
{
    name: 'Event Name',
    description: 'Event Description', //Has possibility of being empty
    imageUrl: 'https://image.url', //Has possibility of being empty
    mapImageUrl: 'https://map-image.url',
    date: { 
        start: 1686841200, 
        end: 1686909600, //Has possibility of being 0
        timezone: 'UTC', //Has possibility of being empty
        when: 'Today' }, //Has possibility of being empty
    location: {
      name: 'Location Name',
      address: 'Location Address',
      mapUrl: 'https://google-maps.url'
    },
    links: [ { //Array containing one or more links to buy tickets and such
        name: 'Event Website',
        url: 'https://event.url'
    } ]
}
```

## Notes
This should be able to scrape most of the events and not break, but the way google events displays data isn't the most predictable thing and although I tried getting all the cases it might still break. If such thing happens feel free to create an [issue](https://github.com/emiipo/google-events-scraper/issues/new).

*Not only this is my first proper package it's also my first time using Typescript so if you have any questions, suggestions or know how to improve it feel free to offer the suggestion or fork this repository and create a pull request!*