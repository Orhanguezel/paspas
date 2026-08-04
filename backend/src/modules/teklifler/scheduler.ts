import { expireDueOffers } from './maintenance';

let timer:ReturnType<typeof setInterval>|null=null;
export function startOfferExpiryScheduler(log:(info:{expired:number;error?:string})=>void=()=>{},intervalMs=5*60_000):void{
  if(process.env.NODE_ENV==='test'||timer)return;
  const tick=async()=>{try{log({expired:await expireDueOffers()});}catch(error){log({expired:0,error:error instanceof Error?error.message:String(error)});}};
  setTimeout(()=>void tick(),15_000);timer=setInterval(()=>void tick(),intervalMs);
}
export function stopOfferExpiryScheduler():void{if(timer){clearInterval(timer);timer=null;}}
