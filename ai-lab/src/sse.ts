export type SSE={event:string;data:string;id?:string};
// Incremental parser: network chunks are neither UTF-8 character nor SSE event boundaries.
export class SSEParser{
 private decoder=new TextDecoder();private buf='';private event='message';private data:string[]=[];private id:string|undefined;
 constructor(private emit:(event:SSE)=>void){}
 push(bytes:Uint8Array){this.buf+=this.decoder.decode(bytes,{stream:true});this.lines(false);}
 end(){this.buf+=this.decoder.decode();this.lines(true);this.buf='';this.data=[]; /* incomplete event discarded */}
 private lines(final:boolean){
  while(true){
   const i=this.buf.search(/[\r\n]/);if(i<0)return;
   if(this.buf[i]==='\r'&&i===this.buf.length-1&&!final)return;
   const n=this.buf[i]==='\r'&&this.buf[i+1]==='\n'?2:1;
   const line=this.buf.slice(0,i);this.buf=this.buf.slice(i+n);
   if(line===''){
    if(this.data.length)this.emit({event:this.event||'message',data:this.data.join('\n'),...(this.id?{id:this.id}:{})});
    this.event='message';this.data=[];continue;
   }
   if(line.startsWith(':'))continue;
   const p=line.indexOf(':'),field=p<0?line:line.slice(0,p);let value=p<0?'':line.slice(p+1);if(value.startsWith(' '))value=value.slice(1);
   if(field==='data')this.data.push(value);if(field==='event')this.event=value;if(field==='id'&&!value.includes('\0'))this.id=value;
  }
 }
}
