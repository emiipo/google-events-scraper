import { PlaywrightCrawler, playwrightUtils } from 'crawlee';

const timezones = ['UTC', 'ANAT', 'SBT', 'AEST', 'JST', 'CST', 'WIB', 'BST', 'UZT', 'GST', 'EEST', 'CEST', 'BST', 'GMT', 'CVT', 'WGST', 'ART', 'EDT', 'CDT', 'CST', 'PDT', 'AKDT', 'HDT', 'HST', 'NUT', 'AoE', 'LINT', 'TOT', 'LHST', 'ACST', 'MMT', 'IST', 'AFT', 'IRST', 'NDT', 'MART', 'CHAST', 'ACWST', 'NPT'];
const months = new Map<string, number>([['Jan',1], ['Feb',2], ['Mar',3], ['Apr',4], ['May',5], ['Jun',6], ['Jul',7], ['Aug',8], ['Sep',9], ['Oct', 10], ['Nov', 11], ['Dec', 12]]);
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function RemoveChar(str:string, char:string, first?:boolean):string {
    let index = str.length-1;
    let x = 0;
    let y = -1;
    if (first){
       index = 0;
       x = 1;
       y = str.length;
    }
    if(str.charAt(index) === char){
        str = str.slice(x, y);
    }
    return str;
}
//The strings are very unpredictable with the characters they use, so it's better to just run them trough this every time to make sure they're properly formatted
function RemoveSpaces(str:string):string {
    str = RemoveChar(str, ' ');
    str = RemoveChar(str, ' ', true);
    str = RemoveChar(str, ' ');
    str = RemoveChar(str, ' ', true);
    return str;
}

//Date & time functions to speed things up
function GetTime(str:string):{hour:number, min:number, str:string} {
    const timeRegex = new RegExp(/([0-9])\d:([0-9])\d/);
    let hour = -1;
    let min = -1;
    const regResult = timeRegex.exec(str);
    if (regResult !== null){
        str = str.slice(0, -regResult[0].length);
        str = RemoveSpaces(str);
        hour = Number((regResult[0].split(':'))[0]);
        min = Number((regResult[0].split(':'))[1]);
    }
    return {
        hour: hour,
        min: min,
        str: str,
    }
}

function GetDay(str:string):{day:number, str:string} {
    let day = -1;
    const dayRegex = new RegExp(/([0-9]){1,2}/);
    const regResult = dayRegex.exec(str);
    if (regResult !== null){
        day = Number(regResult[0]);
        if (regResult.index === 0) {
            str = str.slice(regResult[0].length,str.length);
        } else {
            str = str.slice(0, -regResult[0].length);
        }
        str = RemoveSpaces(str);
    }
    return {
        day: day,
        str: str,
    };
}

function RemoveWeekDays(str:string):string {
    for(const day of weekDays){
        if(str.includes(day)){
            str = str.slice(day.length);
            str = RemoveSpaces(str);
        }
    }
    return str;
}

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
            console.log('--------------------');
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
                    dateString = dateString.slice(0, -timezone.length);
                }
            }
            dateString = RemoveSpaces(dateString!);

            let splitString = dateString!.split('–');
            //First half
            splitString[0] = RemoveSpaces(splitString[0]);

            let timeRes = GetTime(splitString[0]);
            let startHour = timeRes.hour;
            let startMin = timeRes.min;
            splitString[0] = timeRes.str;

            splitString[0] = RemoveChar(splitString[0], ',');

            let splitDate = splitString![0].split(',');
            for (const i in splitDate) splitDate[i] = RemoveSpaces(splitDate[i]);
            
            const yearRegex = new RegExp(/([0-9]){4}/);
            let startDate = splitDate[splitDate.length - 1];
            let year = dateObj.getFullYear();
            let regResult = yearRegex.exec(startDate);
            if (regResult !== null){
                year = Number(regResult[0]);
                startDate = startDate.slice(0, -year.toString().length);
                startDate = RemoveSpaces(startDate);
            }
            if((months.get(startDate.split(' ')[1])! < dateObj.getMonth()+1) || (months.get(startDate.split(' ')[1])! === dateObj.getMonth()+1 && Number(startDate.split(' ')[0]) < dateObj.getDate())){
                year = dateObj.getFullYear() + 1;
            }

            startDate = RemoveWeekDays(startDate);

            let dayRes = GetDay(startDate);
            let startDay = dayRes.day;
            startDate = dayRes.str;

            const startMonth = months.get(startDate)! === undefined? -1 : months.get(startDate)!;

            //Second half
            let endHour = -1;
            let endMin = -1;
            let endDay = -1;
            let endMonth = -1;
            if(splitString.length === 2){
                splitString[1] = RemoveSpaces(splitString[1]);

                timeRes = GetTime(splitString[1]);
                endHour = timeRes.hour;
                endMin = timeRes.min;
                splitString[1] = timeRes.str;

                splitString[1] = RemoveChar(splitString[1], ',');

                splitDate = splitString![1].split(',');
                for (const i in splitDate) splitDate[i] = RemoveSpaces(splitDate[i]);
                
                const yearRegex = new RegExp(/([0-9]){4}/);
                let endDate = splitDate[splitDate.length - 1];
                let regResult = yearRegex.exec(endDate);
                if (regResult !== null){
                    endDate = endDate.slice(0, -year.toString().length);
                    endDate = RemoveSpaces(endDate);
                }

                endDate = RemoveWeekDays(endDate);
                
                dayRes = GetDay(endDate);
                endDay = dayRes.day;
                endDate = dayRes.str;

                endMonth = months.get(endDate)! === undefined? -1 : months.get(endDate)!;
            }
        
            //Final
            let finalStartDate:number|Date = 0;
            let finalEndDate:number|Date = 0;
            if(splitString.length === 2){
                
            } else {
                if (startHour === -1) startHour = 0;
                if (startMin === -1) startMin = 0;
                console.log(startHour);
                finalStartDate = new Date(year, startMonth-1, startDay, startHour, startMin);
                console.log(finalStartDate.getHours());
            }

            const date = {
                start: finalStartDate,
                end: finalEndDate,
                timezone: timezone,
                when: await evnt.locator('.yZX6Sd').textContent(),
            }
            console.log(date);

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
                    name: await lnk.locator('.NLMF7b span').first().textContent(),
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
});

await crawler.run(['https://www.google.com/search?q=Splendour+in+the+grass&ibp=htl;events']);
