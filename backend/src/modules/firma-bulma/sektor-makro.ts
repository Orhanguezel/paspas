export type MakroGosterge = { code:string; label:string; value:number; year:number; unit:string; url:string };

const GOSTERGELER:Record<string,{label:string;unit:string}>={
  'NY.GDP.MKTP.KD.ZG':{label:'Ekonomik büyüme',unit:'%'},
  'BX.KLT.DINV.WD.GD.ZS':{label:'Doğrudan yatırım / GSYH',unit:'%'},
  'LP.LPI.OVRL.XQ':{label:'Lojistik performansı',unit:'/ 5'},
  'GOV_WGI_PV_EST':{label:'Siyasi istikrar',unit:'(-2,5 / +2,5)'},
};

export async function sektorMakro(countries:string[]):Promise<{data:Record<string,MakroGosterge[]>;status:'ready'|'partial'|'unavailable'}>{
  const codes=[...new Set(countries)].filter((code)=>/^[A-Z]{2}$/.test(code)).slice(0,5);
  if(!codes.length)return {data:{},status:'unavailable'};
  try{
    const end=new Date().getUTCFullYear();
    const url=`https://api.worldbank.org/v2/country/${codes.join(';')}/indicator/${Object.keys(GOSTERGELER).join(';')}?source=2&format=json&date=${end-10}:${end}&per_page=1000`;
    const response=await fetch(url,{signal:AbortSignal.timeout(10_000)});
    if(!response.ok)throw new Error('macro_unavailable');
    const body=await response.json() as any;
    if(!Array.isArray(body?.[1]))throw new Error('macro_shape');
    const data:Record<string,MakroGosterge[]>={};
    for(const row of body[1]){
      const country=String(row.country?.id??''),code=String(row.indicator?.id??''),meta=GOSTERGELER[code];
      if(!codes.includes(country)||!meta||row.value===null||!Number.isFinite(Number(row.value)))continue;
      const list=data[country]??=[];const old=list.find((item)=>item.code===code);
      if(old&&old.year>=Number(row.date))continue;
      if(old)list.splice(list.indexOf(old),1);
      list.push({code,...meta,value:Number(row.value),year:Number(row.date),url:`https://data.worldbank.org/indicator/${code}?locations=${country}`});
      data[country]=list;
    }
    return {data,status:codes.every((code)=>(data[code]?.length??0)===4)?'ready':'partial'};
  }catch{return {data:{},status:'unavailable'};}
}
