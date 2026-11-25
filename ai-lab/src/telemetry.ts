import { trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
export function initTracing(){const p=new NodeTracerProvider();p.register();return p;}
export function safeEvent(input:Record<string,unknown>){
 const stages=['retrieve','generate','cite','request'];const errors=['NONE','VERSION_MISMATCH','TIMEOUT','FAILED'];
 const version=(v:unknown)=>typeof v==='string'&&/^\d+\.\d+\.\d+$/.test(v)?v:'unknown';
 return {stage:stages.includes(String(input.stage))?String(input.stage):'request',requested_version:version(input.requested_version),
 retrieved_versions:Array.isArray(input.retrieved_versions)?input.retrieved_versions.map(version).slice(0,5):[],
 error_type:errors.includes(String(input.error_type))?String(input.error_type):'FAILED'};
}
export function observed<T>(stage:string,fn:()=>T){
 return trace.getTracer('docs-lab').startActiveSpan(stage,span=>{try{return fn();}finally{span.end();}});
}
