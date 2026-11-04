import MalKabulClient from './_components/mal-kabul-client';
import DepoMalKabulClient from './_components/depo-mal-kabul-client';

export default function Page() {
  return <>
    <div className="md:hidden"><DepoMalKabulClient /></div>
    <div className="hidden md:block"><MalKabulClient /></div>
  </>;
}
