import { PlaywrightCrawler, playwrightUtils } from 'crawlee';
import moment from 'moment';

const timezones = ['ACDT', 'ACST', 'ACT', 'ACWST', 'ADT', 'AEDT', 'AEST', 'AET', 'AFT', 'AKDT', 'AKST', 'ALMT', 'AMST', 'AMT', 'ANAST', 'ANAT', 'AQTT', 'ART', 'AST', 'AT', 'AWDT', 'AWST', 'AZOST', 'AZST', 'AZT', 'AoE', 'BNT', 'BOT', 'BRST', 'BRT', 'BST', 'BTT', 'CAST', 'CAT', 'CCT', 'CDT', 'CEST', 'CET', 'CHADT', 'CHAST', 'CHOST', 'CHOT', 'CHUT', 'CIDST', 'CIST', 'CKT', 'CLST', 'CLT', 'COT', 'CST', 'CT', 'CVT', 'CXT', 'ChST', 'DAVT', 'DDUT', 'EASST', 'EAST', 'EAT', 'ECT', 'EDT', 'EEST', 'EET', 'EGST', 'EGT', 'EST', 'ET', 'FET', 'FJST', 'FJT', 'FKST', 'FKT', 'FNT', 'GALT', 'GAMT', 'GET', 'GFT', 'GILT', 'GMT', 'GST', 'GYT', 'HDT', 'HKT', 'HOVST', 'HOVT', 'HST', 'ICT', 'IDT', 'IOT', 'IRDT', 'IRKST', 'IRKT', 'IRST', 'IST', 'JST', 'KGT', 'KOST', 'KRAST', 'KRAT', 'KST', 'KUYT', 'LHDT', 'LHST', 'LINT', 'MAGST', 'MAGT', 'MART', 'MAWT', 'MDT', 'MHT', 'MMT', 'MSD', 'MSK', 'MST', 'MT', 'MUT', 'MVT', 'MYT', 'NCT', 'NDT', 'NFDT', 'NFT', 'NOVST', 'NOVT', 'NPT', 'NRT', 'NST', 'NUT', 'NZDT', 'NZST', 'OMSST', 'OMST', 'ORAT', 'PDT', 'PET', 'PETST', 'PETT', 'PGT', 'PHOT', 'PHT', 'PKT', 'PMDT', 'PMST', 'PONT', 'PST', 'PT', 'PWT', 'PYST', 'PYT', 'QYZT', 'RET', 'ROTT', 'SAKT', 'SAMT', 'SAST', 'SBT', 'SCT', 'SGT', 'SRET', 'SRT', 'SST', 'SYOT', 'TAHT', 'TFT', 'TJT', 'TKT', 'TLT', 'TMT', 'TOST', 'TOT', 'TRT', 'TVT', 'ULAST', 'ULAT', 'UTC', 'UYST', 'UYT', 'UZT', 'VET', 'VLAST', 'VLAT', 'VOST', 'VUT', 'WAKT', 'WARST', 'WAST', 'WAT', 'WEST', 'WET', 'WFT', 'WGST', 'WGT', 'WIB', 'WIT', 'WITA', 'WST', 'WT', 'YAKST', 'YAKT', 'YAPT', 'YEKST', 'YEKT'];
const oneLetterTimezones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const months = new Map<string, number>([['Jan',1], ['Feb',2], ['Mar',3], ['Apr',4], ['May',5], ['Jun',6], ['Jul',7], ['Aug',8], ['Sept',9], ['Oct', 10], ['Nov', 11], ['Dec', 12]]);
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

function CheckIfValid(start:number, end:number, num?:number):{start:number, end:number} {
    if(start === -1 && end !== -1){
        start = end;
    } else if (start !== -1 && end === -1){
        end = start;
    } else if (start === -1 && end === -1){
        start = num? num : 0;
        end = num? num : 0;
    }

    return {
        start: start,
        end: end,
    }
}

export class gEventsScraper {
    constructor(){}

    private crawler = new PlaywrightCrawler({
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
                    mapImageUrl: 'https://google.com' + await evnt.locator('div[jsname="i4ewOd"] img[src]').first().getAttribute('src'),
                    date: date,
                    location: location,
                    links: links,
                }
    
                console.log(results);
            }
        },
        headless: false,
    });

    async Scrape(query:string) {
        query = query.replace(' ', '+');
        if(this.crawler.running){
            await this.crawler.addRequests(['https://www.google.com/search?q=' + encodeURI(query) + '&ibp=htl;events']);
        } else {
            await this.crawler.run(['https://www.google.com/search?q=' + encodeURI(query) + '&ibp=htl;events']);
        }
    }
}

const scrp = new gEventsScraper();
scrp.Scrape('google events');
const scrp2 = new gEventsScraper();
scrp2.Scrape('google events');