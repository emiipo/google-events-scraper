import { PlaywrightCrawler, playwrightUtils } from 'crawlee';

const timezones = ['UTC', 'ANAT', 'SBT', 'AEST', 'JST', 'CST', 'WIB', 'BST', 'UZT', 'GST', 'EEST', 'CEST', 'BST', 'GMT', 'CVT', 'WGST', 'ART', 'EDT', 'CDT', 'CST', 'PDT', 'AKDT', 'HDT', 'HST', 'NUT', 'AoE', 'LINT', 'TOT', 'LHST', 'ACST', 'MMT', 'IST', 'AFT', 'IRST', 'NDT', 'MART', 'CHAST', 'ACWST', 'NPT'];
const weekDays = new Map<string, string>([['Mon','Monday'], ['Tue','Tuesday'], ['Wed','Wednesday'], ['Thu','Thursday'], ['Fri','Friday'], ['Sat','Saturday'], ['Sun','Sunday']]);
const months = new Map<string, number>([['Jan',1], ['Feb',2], ['Mar',3], ['Apr',4], ['May',5], ['Jun',6], ['Jul',7], ['Aug',8], ['Sep',9], ['Oct', 10], ['Nov', 11], ['Dec', 12]]);

const crawler = new PlaywrightCrawler({
    preNavigationHooks: [
        async (crawlingContext) => {
            //This cookie is required incase google asks for cookie consent and obstructs you from viewing the rest of the info
            await crawlingContext.page.context().addCookies([{
                name: 'CONSENT',
                value: 'YES+',
                domain: 'www.google.com',
                path: '/',
            }])
        },
    ],
    async requestHandler({ page }){
        //Load all the content
        const eventsContainter = await page.locator('div[jsname="CaV2mb"]');
        const containerBox = await eventsContainter.boundingBox();

        await page.mouse.move(containerBox!.x + containerBox!.width / 2, containerBox!.y + containerBox!.height / 2)
        await playwrightUtils.infiniteScroll(page);

        //Scrape the content
        const events = await page.locator('.voohof li').all();
        for(const event of events){
            //Click on the event and load the data(this is mainly needed to get image URL's)
            await event.click();
            const id = await event.getAttribute('data-encoded-docid');
            const evnt = page.locator('div[data-encoded-docid="' + id + '"]');

            //Description handling just in case it doesn't have one
            let desc:string|null = '';
            const descLocator = await evnt.locator('.PVlUWc');
            if(await descLocator.count() > 0){
                desc = await descLocator.textContent();
            }

            //Date & time handling
            const dateObj = new Date();
            let dateString = await evnt.locator('.Gkoz3').textContent();

            let timezone = '';
            for(const zone of timezones){
                if(dateString?.includes(zone)){
                    timezone = dateString.substring(dateString.indexOf(zone));
                    dateString = dateString.slice(0, -timezone.length-1);
                }
            }
            let splitString = dateString!.split('–');
            if(splitString[0].charAt(splitString[0].length-1) === ' '){
                splitString[0] = splitString[0].slice(0, -1);
            }
            if (splitString.length === 2){
                if(splitString[1].charAt(0) === ' '){
                    splitString[1] = splitString[1].slice(1, splitString[1].length);
                }
            }

            const timeRegex = new RegExp(/([0-9])\d:([0-9])\d/);
            let startTime = '';
            let regResult = timeRegex.exec(splitString[0]);
            if (regResult !== null){
                startTime = regResult[0];
                splitString[0] = splitString![0].slice(0, -startTime.length-1);
                if(splitString[0].charAt(splitString[0].length-1) === ' '){
                    splitString[0] = splitString[0].slice(0, -1);
                }
            }

            let endTime = '';
            regResult = timeRegex.exec(splitString[1]);
            if (regResult !== null && splitString.length === 2){
                endTime = regResult[0];
                splitString[1] = splitString[1].slice(0, -endTime.length-1);
                if(splitString[1].charAt(splitString[1].length-1) === ' '){
                splitString[1] = splitString[1].slice(0, -1);
                }
            }

            if(splitString[0].charAt(splitString[0].length-1) === ','){
                splitString[0] = splitString[0].slice(0, -1);
            }
            if(splitString.length === 2 && splitString[1].charAt(splitString[1].length-1) === ','){
                splitString[1] = splitString[1].slice(0, -1);
            }

            let splitDate = splitString![0].split(',');
            const startDay = splitDate.length === 2? weekDays.get(splitDate[0]) : '';
            const yearRegex = new RegExp(/([0-9]){4}/);
            let startDate = splitDate[splitDate.length - 1];
            if(startDate.charAt(0) === ' '){
                startDate = startDate.slice(1, startDate.length);
            }
            let year = dateObj.getFullYear();
            regResult = yearRegex.exec(startDate);
            if (regResult !== null){
                year = Number(regResult[0]);
                startDate = startDate.slice(0, -year.toString().length-1);
                if(startDate.charAt(startDate.length-1) === ' '){
                    startDate = startDate.slice(0, -1);
                }
            }
            if((months.get(startDate.split(' ')[1])! < dateObj.getMonth()+1) || (months.get(startDate.split(' ')[1])! === dateObj.getMonth()+1 && Number(startDate.split(' ')[0]) < dateObj.getDate())){
                year = dateObj.getFullYear() + 1;
            }
            const finalStartDate = new Date(year, months.get(startDate.split(' ')[1])!, Number(startDate.split(' ')[0]), Number(startTime.split(':')[0]), Number(startTime.split(':')[1])).getTime();

            let endDay:string|undefined = '';
            let endDate:string|undefined = '';
            if (splitString[1] !== '' && splitString.length === 2){
                splitDate = splitString![1].split(',');
                if(splitDate[0].charAt(0) === ' '){
                    splitDate[0] = splitDate[0].slice(1, splitDate.length);
                }
                console.log(splitDate);
                endDay = splitDate.length === 2? weekDays.get(splitDate[0]) : '';
                endDate = splitDate[splitDate.length - 1];
                if(endDate.charAt(0) === ' '){
                    endDate = endDate.slice(1, startDate.length);
                }
                const finalEndDate = new Date(year, months.get(startDate.split(' ')[1])!, Number(startDate.split(' ')[0]), Number(startTime.split(':')[0]), Number(startTime.split(':')[1])).getTime();
            }

            const date = {
                year: year,
                startDate: finalStartDate,
                endDate: endDate,
                startDay: startDay,
                endDay: endDay,
                startTime: startTime,
                endTime: endTime,
                timezone: timezone,
                when: await evnt.locator('.yZX6Sd').textContent(),
            }

            //Location handling
            const lineOne = await evnt.locator('.n3VjZe').textContent();
            const lineTwo = await evnt.locator('.U6txu').textContent();
            const mapUrl = 'https://google.com' + await evnt.locator('.ozQmAd').getAttribute('data-url');
            const location = {
                name: lineTwo === ''? '' : lineOne,
                address: lineTwo === ''? lineOne : lineTwo,
                mapUrl: mapUrl,
            }

            //Link handling
            let links = [];
            const linkLocators = await evnt.locator('div[jsname="CzizI"]').locator('.SKIyM').all();
            for (const lnk of linkLocators) {
                const link = {
                    name: await lnk.locator('.NLMF7b span').textContent(),
                    url: await lnk.getAttribute('href'),
                }
                links.push(link);
            }

            //Results
            const results = {
                name: await evnt.locator('div[jsname="r4nke"]').textContent(),
                description: desc,
                imageUrl: await evnt.locator('div[jsname="s2gQvd"] img[src]').first().getAttribute('src'),
                date: date,
                location: location,
                links: links,
            }

            console.log(results);
        }
    },
    headless: false,
});

await crawler.run(['https://www.google.com/search?q=google+events&ibp=htl;events']);
