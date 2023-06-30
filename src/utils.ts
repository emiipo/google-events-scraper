const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function RemoveChar(str:string, char:string, first?:boolean):string {
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
export function RemoveSpaces(str:string):string {
    str = RemoveChar(str, ' ');
    str = RemoveChar(str, ' ', true);
    str = RemoveChar(str, ' ');
    str = RemoveChar(str, ' ', true);
    return str;
}

//Date & time functions to speed things up
export function GetTime(str:string):{hour:number, min:number, str:string} {
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

export function GetDay(str:string):{day:number, str:string} {
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

export function RemoveWeekDays(str:string):string {
    for(const day of weekDays){
        if(str.includes(day)){
            str = str.slice(day.length);
            str = RemoveSpaces(str);
        }
    }
    return str;
}

export function CheckIfValid(start:number, end:number, num?:number):{start:number, end:number} {
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