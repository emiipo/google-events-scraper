import { PlaywrightCrawler, playwrightUtils } from 'crawlee';
import moment from 'moment';
import { RemoveSpaces, RemoveChar, GetTime, GetDay, RemoveWeekDays, CheckIfValid } from './utils.js';

const timezones = ['ACDT', 'ACST', 'ACT', 'ACWST', 'ADT', 'AEDT', 'AEST', 'AET', 'AFT', 'AKDT', 'AKST', 'ALMT', 'AMST', 'AMT', 'ANAST', 'ANAT', 'AQTT', 'ART', 'AST', 'AT', 'AWDT', 'AWST', 'AZOST', 'AZST', 'AZT', 'AoE', 'BNT', 'BOT', 'BRST', 'BRT', 'BST', 'BTT', 'CAST', 'CAT', 'CCT', 'CDT', 'CEST', 'CET', 'CHADT', 'CHAST', 'CHOST', 'CHOT', 'CHUT', 'CIDST', 'CIST', 'CKT', 'CLST', 'CLT', 'COT', 'CST', 'CT', 'CVT', 'CXT', 'ChST', 'DAVT', 'DDUT', 'EASST', 'EAST', 'EAT', 'ECT', 'EDT', 'EEST', 'EET', 'EGST', 'EGT', 'EST', 'ET', 'FET', 'FJST', 'FJT', 'FKST', 'FKT', 'FNT', 'GALT', 'GAMT', 'GET', 'GFT', 'GILT', 'GMT', 'GST', 'GYT', 'HDT', 'HKT', 'HOVST', 'HOVT', 'HST', 'ICT', 'IDT', 'IOT', 'IRDT', 'IRKST', 'IRKT', 'IRST', 'IST', 'JST', 'KGT', 'KOST', 'KRAST', 'KRAT', 'KST', 'KUYT', 'LHDT', 'LHST', 'LINT', 'MAGST', 'MAGT', 'MART', 'MAWT', 'MDT', 'MHT', 'MMT', 'MSD', 'MSK', 'MST', 'MT', 'MUT', 'MVT', 'MYT', 'NCT', 'NDT', 'NFDT', 'NFT', 'NOVST', 'NOVT', 'NPT', 'NRT', 'NST', 'NUT', 'NZDT', 'NZST', 'OMSST', 'OMST', 'ORAT', 'PDT', 'PET', 'PETST', 'PETT', 'PGT', 'PHOT', 'PHT', 'PKT', 'PMDT', 'PMST', 'PONT', 'PST', 'PT', 'PWT', 'PYST', 'PYT', 'QYZT', 'RET', 'ROTT', 'SAKT', 'SAMT', 'SAST', 'SBT', 'SCT', 'SGT', 'SRET', 'SRT', 'SST', 'SYOT', 'TAHT', 'TFT', 'TJT', 'TKT', 'TLT', 'TMT', 'TOST', 'TOT', 'TRT', 'TVT', 'ULAST', 'ULAT', 'UTC', 'UYST', 'UYT', 'UZT', 'VET', 'VLAST', 'VLAT', 'VOST', 'VUT', 'WAKT', 'WARST', 'WAST', 'WAT', 'WEST', 'WET', 'WFT', 'WGST', 'WGT', 'WIB', 'WIT', 'WITA', 'WST', 'WT', 'YAKST', 'YAKT', 'YAPT', 'YEKST', 'YEKT'];
const oneLetterTimezones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const months = new Map<string, number>([['Jan',1], ['Feb',2], ['Mar',3], ['Apr',4], ['May',5], ['Jun',6], ['Jul',7], ['Aug',8], ['Sept',9], ['Oct', 10], ['Nov', 11], ['Dec', 12]]);

export default class gEventsScraper {
    data = [];

    async Scrape(query:string, options?:{ today?:boolean, tomorrow?:boolean, thisWeek?:boolean, thisWeekend?:boolean, nextWeek?:boolean, nextMonth?:boolean}):Promise<any> {
        query = query.split(' ').join('+');
        let when = '';
        if(options?.today) when = '&htichips=date:today';
        else if(options?.tomorrow) when = '&htichips=date:tomorrow';
        else if(options?.thisWeek) when = '&htichips=date:week';
        else if(options?.thisWeekend) when = '&htichips=date:weekend';
        else if(options?.nextWeek) when = '&htichips=date:next_week';
        else if(options?.nextMonth) when = '&htichips=date:next_month';

        let allResults:any = [];

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
                    //On a rare occasion an event will have a hidden duplicate, thus we just skip it if we can't see it (from what I've tested the next item will still be the correct one with the correct information)
                    if(!(await event.isVisible())) continue;
                    await event.click();
                    
                    const id = await event.getAttribute('data-encoded-docid');
                    const evnt = page.locator('div[data-encoded-docid="' + id + '"]');
        
                    //Description handling just in case it doesn't have one
                    let desc:string|null = '';
                    const descLocator = await evnt.locator('.PVlUWc').first();
                    if(await descLocator.count() > 0){
                        desc = await descLocator.textContent();
                    }
        
                    //Image handling
                    let imageUrl:string|null = '';
                    const imageLocator = await evnt.locator('div[jsname="HiaYvf"]').first();
                    if( await imageLocator.count() > 0 ) {
                        imageUrl = await imageLocator.locator('img[src]').getAttribute('src');
                    }

                    let mapImageUrl:string|null = '';
                    const mapImageLocator = await evnt.locator('div[jsname="i4ewOd"]').first();
                    if( await mapImageLocator.count() > 0 ) {
                        mapImageUrl = 'https://google.com' + await mapImageLocator.locator('img[src]').getAttribute('src');
                    }
        
                    //Date & time handling
                    const dateObj = new Date();
                    let dateString = await evnt.locator('.Gkoz3').first().textContent();
        
                    let timezone = '';
                    for(const zone of timezones){
                        if(dateString?.includes(zone)){
                            timezone = dateString.substring(dateString.indexOf(zone));
                            dateString = dateString.slice(0, -timezone.length);
                            break;
                        }
                    }
                    //Doing a second check with one letter time zones due to them being detected in regular words
                    //Not very sure of these military time zones but I'm assuming they don't have offsets and are rarely used BUT just in case
                    for(const zone of oneLetterTimezones){
                        if(dateString?.charAt(dateString.length-1) === zone){
                            timezone = dateString.substring(dateString.indexOf(zone));
                            dateString = dateString.slice(0, -timezone.length);
                            break;
                        }
                    }
        
                    dateString = RemoveSpaces(dateString!);
        
                    let splitString = dateString!.split('–');
                    //First half
                    let startHour = -1;
                    let startMin = -1;
                    let startDay = -1;
                    let startMonth = -1;
                    splitString[0] = RemoveSpaces(splitString[0]);
        
                    let timeRes = GetTime(splitString[0]);
                    startHour = timeRes.hour;
                    startMin = timeRes.min;
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
                    startDay = dayRes.day;
                    startDate = dayRes.str;
        
                    startMonth = months.get(startDate)! === undefined? -1 : months.get(startDate)!;
        
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
                    let finalStartDate = 0;
                    let finalEndDate = 0;
                    if (splitString.length === 2){
                        let checkRes = CheckIfValid(startHour, endHour);
                        startHour = checkRes.start;
                        endHour = checkRes.end;
                        
                        checkRes = CheckIfValid(startMin, endMin);
                        startMin = checkRes.start;
                        endMin = checkRes.end;
        
                        checkRes = CheckIfValid(startDay, endDay, 1);
                        startDay = checkRes.start;
                        endDay = checkRes.end;
        
                        checkRes = CheckIfValid(startMonth, endMonth);
                        startMonth = checkRes.start;
                        endMonth = checkRes.end;
        
                        finalStartDate = moment.utc([year, startMonth-1, startDay, startHour, startMin]).unix();;
                        finalEndDate = moment.utc([year, endMonth-1, endDay, endHour, endMin]).unix();;
                    } else {
                        if (startHour === -1) startHour = 0;
                        if (startMin === -1) startMin = 0;
                        if (startDay === -1) startDay = 1;
                        if (startMonth === -1) startMonth = 0;
                        finalStartDate = moment.utc([year, startMonth-1, startDay, startHour, startMin]).unix();;
                    }
        
                    const date = {
                        start: finalStartDate,
                        end: finalEndDate,
                        timezone: timezone,
                        when: await evnt.locator('.yZX6Sd').first().textContent(),
                    }
        
                    //Location handling
                    const lineOne = await evnt.locator('.n3VjZe').first().textContent();
                    const lineTwo = await evnt.locator('.U6txu').first().textContent();
                    const mapUrl = 'https://google.com' + await evnt.locator('.ozQmAd').first().getAttribute('data-url');
                    const location = {
                        name: lineTwo === ''? '' : lineOne,
                        address: lineTwo === ''? lineOne : lineTwo,
                        mapUrl: mapUrl,
                    }
        
                    //Link handling
                    let links = [];
                    const linkLocators = await evnt.locator('div[jsname="CzizI"]').first().locator('.SKIyM').all();
                    for (const lnk of linkLocators) {
                        const link = {
                            name: await lnk.locator('.NLMF7b span').first().textContent(),
                            url: await lnk.getAttribute('href'),
                        }
                        links.push(link);
                    }
        
                    //Results
                    const results = {
                        name: await evnt.locator('div[jsname="r4nke"]').first().textContent(),
                        description: desc,
                        imageUrl: imageUrl,
                        mapImageUrl: mapImageUrl,
                        date: date,
                        location: location,
                        links: links,
                    }
                    allResults.push(results);
                }
            },
        });

        await crawler.run(['https://www.google.com/search?q=' + encodeURI(query) + '&ibp=htl;events#htivrt=events' + when]);
        this.data = allResults;
        return allResults;
    }

    GetResults():any {
        return this.data;
    }
}